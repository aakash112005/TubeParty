import { roomManager } from '../RoomManager.js';
import { Participant } from '../Participant.js';
import { ROLES } from '../../constants/roles.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { validateUsername, validateRoomCode } from '../../validators/roomValidators.js';
import { logger } from '../../utils/logger.js';

// How long a disconnected participant's slot is held open, waiting
// for them to reconnect with the same participantId, before they're
// treated as having actually left (and, if they were host, before
// host is auto-transferred). A page refresh is indistinguishable from
// a real disconnect at the moment the socket drops - this window is
// what lets a refresh recover cleanly instead of losing role/host
// status or triggering a premature host hand-off.
const RECONNECT_GRACE_MS = Number(process.env.PARTICIPANT_RECONNECT_GRACE_MS || 10000);

function emitError(socket, message) {
  socket.emit(SOCKET_EVENTS.ERROR, { message });
}

function sendSyncState(socket, room, participant) {
  socket.emit(SOCKET_EVENTS.SYNC_STATE, {
    currentVideo: room.getCurrentVideoSnapshot(),
    participants: room.getParticipantsList(),
    chatMessages: room.chatMessages,
    settings: room.settings,
    you: participant.toJSON(),
  });
}

export function registerRoomHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomCode, username, participantId }) => {
    const usernameError = validateUsername(username);
    if (usernameError) return emitError(socket, usernameError);

    const codeError = validateRoomCode(roomCode);
    if (codeError) return emitError(socket, codeError);

    if (!participantId || typeof participantId !== 'string') {
      return emitError(socket, 'Missing participant identity. Please refresh and try again.');
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) return emitError(socket, 'Room not found. Check the code and try again.');

    const trimmedUsername = username.trim();

    // --- Reconnect path: this participantId already has a slot in
    // this room (page refresh, dropped connection, etc). Restore
    // their existing role/identity instead of creating a new
    // Participant - this is the fix for "refresh loses my role". ---
    const existing = room.getParticipantById(participantId);
    if (existing) {
      // Idempotent no-op guard: if this exact socket already owns
      // this participant slot (e.g. a duplicate join_room emit),
      // don't redo any work, just re-send state.
      if (existing.socketId !== socket.id) {
        room.rebindSocket(participantId, socket.id);
      }
      room.cancelScheduledRemoval(participantId);

      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.username = existing.username;
      socket.data.participantId = participantId;

      sendSyncState(socket, room, existing);

      // Let everyone else know this participant is back online -
      // ROOM_UPDATED is a silent presence sync (no "X joined" toast),
      // since this isn't really a new join.
      socket.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, {
        participants: room.getParticipantsList(),
      });

      logger.debug(`${existing.username} reconnected to room ${room.code} (role: ${existing.role})`);
      return;
    }

    // --- Fresh join path ---
    if (room.isUsernameTaken(trimmedUsername)) {
      return emitError(socket, 'That username is already taken in this room.');
    }

    // The very first person to join a freshly-created room becomes
    // Host automatically (RoomManager.createRoom sets hostUsername but
    // doesn't add a participant yet - see roomController.js).
    const isFirstParticipant = room.isEmpty;
    const role = isFirstParticipant ? ROLES.HOST : ROLES.PARTICIPANT;

    const participant = new Participant({
      participantId,
      socketId: socket.id,
      username: trimmedUsername,
      role,
    });

    room.addParticipant(participant);
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.username = trimmedUsername;
    socket.data.participantId = participantId;

    sendSyncState(socket, room, participant);

    const activity = room.addActivity({
      type: 'user_joined',
      message: `${trimmedUsername} joined the room`,
    });

    // Tell everyone else a new participant arrived.
    socket.to(room.code).emit(SOCKET_EVENTS.USER_JOINED, {
      participant: participant.toJSON(),
      participants: room.getParticipantsList(),
      activity,
    });

    logger.debug(`${trimmedUsername} joined room ${room.code} as ${role}`);
  });

  // Explicit, intentional leave (Leave Room button / navigating away
  // within the app). This is NOT ambiguous like a raw disconnect, so
  // it's handled immediately with no grace period.
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
    handleExplicitLeave(io, socket);
  });

  // Raw transport disconnect - could be a real departure, or could be
  // a page refresh that's about to reconnect in under a second. Goes
  // through the grace-period path instead of removing immediately.
  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    handleSocketDisconnect(io, socket);
  });
}

function finalizeDeparture(io, roomCode, room, participant, reasonLabel) {
  const wasHost = participant.role === ROLES.HOST;

  room.removeParticipant(participant.participantId);

  const activity = room.addActivity({
    type: 'user_left',
    message: `${participant.username} ${reasonLabel}`,
  });

  io.to(roomCode).emit(SOCKET_EVENTS.USER_LEFT, {
    participantId: participant.participantId,
    username: participant.username,
    participants: room.getParticipantsList(),
    activity,
  });

  if (wasHost) {
    const nextHost = room.pickNextHost(participant.participantId);
    if (nextHost) {
      room.setHost(nextHost);
      const hostActivity = room.addActivity({
        type: 'host_changed',
        message: `${nextHost.username} is now the host`,
      });
      io.to(roomCode).emit(SOCKET_EVENTS.HOST_CHANGED, {
        newHost: nextHost.toJSON(),
        participants: room.getParticipantsList(),
        activity: hostActivity,
      });
    }
  }
}

function handleExplicitLeave(io, socket) {
  const { roomCode, participantId } = socket.data;
  if (!roomCode || !participantId) return;

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const participant = room.getParticipantById(participantId);
  // Already gone (e.g. they were kicked moments ago) - nothing to do.
  // Without this guard a kicked user's own cleanup-triggered
  // leave_room would rebroadcast a phantom "left the room" activity.
  if (!participant) return;

  socket.leave(roomCode);
  finalizeDeparture(io, roomCode, room, participant, 'left the room');
}

function handleSocketDisconnect(io, socket) {
  const { roomCode, participantId } = socket.data;
  if (!roomCode || !participantId) return;

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const participant = room.getParticipantById(participantId);
  if (!participant) return;

  // If this participant has already reconnected with a NEW socket by
  // the time this (possibly delayed) disconnect event fires, this
  // event describes a superseded connection - ignore it entirely.
  // Without this check, a stale disconnect for the OLD socket could
  // incorrectly tear down the participant's brand-new session.
  if (participant.socketId !== socket.id) return;

  participant.isOnline = false;
  room.touch();

  // Silent presence update so the UI can grey them out as
  // "reconnecting" without firing a "user left" toast for what might
  // just be a refresh in progress.
  io.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATED, {
    participants: room.getParticipantsList(),
  });

  room.scheduleRemoval(participantId, RECONNECT_GRACE_MS, () => {
    // Re-check they're still offline (defensive - reconnection already
    // cancels this timer, but guard against any edge-case ordering).
    const current = room.getParticipantById(participantId);
    if (!current || current.isOnline) return;

    finalizeDeparture(io, roomCode, room, current, 'disconnected');
  });
}
