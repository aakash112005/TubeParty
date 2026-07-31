import { roomManager } from '../RoomManager.js';
import { PermissionManager } from '../PermissionManager.js';
import { ROLES } from '../../constants/roles.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';

const ASSIGNABLE_ROLES = [ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER];

function emitError(socket, message) {
  socket.emit(SOCKET_EVENTS.ERROR, { message });
}

// All moderation actions target a `targetParticipantId`, never a
// socketId - a socketId goes stale the instant the target refreshes,
// which was the root cause of "transfer host sometimes doesn't work".
// participantId is stable across reconnects, so it's always valid as
// long as the target is still in the room.
function getSelfAndRoom(socket) {
  const room = roomManager.getRoom(socket.data.roomCode);
  if (!room) return {};
  const self = room.getParticipantById(socket.data.participantId);
  return { room, self };
}

export function registerModerationHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.ASSIGN_ROLE, ({ targetParticipantId, role }) => {
    const { room, self } = getSelfAndRoom(socket);
    if (!room || !self) return emitError(socket, 'Room not found.');

    if (!PermissionManager.canAssignRole(self.role)) {
      return emitError(socket, 'Only the host can assign roles.');
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return emitError(socket, 'Invalid role.');
    }

    const target = room.getParticipantById(targetParticipantId);
    if (!target) return emitError(socket, 'Participant not found - they may have left the room.');
    if (target.role === ROLES.HOST) {
      return emitError(socket, 'Use "Transfer Host" to change the host.');
    }

    target.role = role;
    room.touch();

    const activity = room.addActivity({
      type: 'role_updated',
      message: `${self.username} made ${target.username} ${role}`,
    });

    io.to(room.code).emit(SOCKET_EVENTS.ROLE_UPDATED, {
      participant: target.toJSON(),
      participants: room.getParticipantsList(),
      activity,
    });
  });

  socket.on(SOCKET_EVENTS.REMOVE_PARTICIPANT, ({ targetParticipantId }) => {
    const { room, self } = getSelfAndRoom(socket);
    if (!room || !self) return emitError(socket, 'Room not found.');

    if (!PermissionManager.canRemoveParticipant(self.role)) {
      return emitError(socket, 'Only the host can remove participants.');
    }

    const target = room.getParticipantById(targetParticipantId);
    if (!target) return emitError(socket, 'Participant not found - they may have already left.');
    if (target.participantId === self.participantId) {
      return emitError(socket, 'You cannot remove yourself.');
    }

    // Capture the target's *current* live socket before removing them
    // from room state, so we can still notify that exact connection.
    const targetSocketId = target.socketId;

    room.removeParticipant(targetParticipantId);

    const activity = room.addActivity({
      type: 'participant_removed',
      message: `${self.username} removed ${target.username}`,
    });

    io.to(room.code).emit(SOCKET_EVENTS.PARTICIPANT_REMOVED, {
      participantId: targetParticipantId,
      username: target.username,
      participants: room.getParticipantsList(),
      activity,
    });

    // Explicitly tell the removed user's live connection so it can
    // redirect them home, and take them out of the socket.io room so
    // they stop receiving further broadcasts even though their
    // transport connection stays open.
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit(SOCKET_EVENTS.PARTICIPANT_REMOVED, {
        participantId: targetParticipantId,
        username: target.username,
        youWereRemoved: true,
      });
      targetSocket.leave(room.code);
      targetSocket.data.roomCode = null;
      targetSocket.data.participantId = null;
    }
  });

  socket.on(SOCKET_EVENTS.TRANSFER_HOST, ({ targetParticipantId }) => {
    const { room, self } = getSelfAndRoom(socket);
    if (!room || !self) return emitError(socket, 'Room not found.');

    if (!PermissionManager.canTransferHost(self.role)) {
      return emitError(socket, 'Only the host can transfer ownership.');
    }

    const target = room.getParticipantById(targetParticipantId);
    if (!target) return emitError(socket, 'Participant not found - they may have left the room.');
    if (!target.isOnline) {
      return emitError(socket, `${target.username} is currently disconnected and can't be made host.`);
    }

    room.setHost(target);

    const activity = room.addActivity({
      type: 'host_changed',
      message: `${self.username} made ${target.username} the host`,
    });

    io.to(room.code).emit(SOCKET_EVENTS.HOST_CHANGED, {
      newHost: target.toJSON(),
      participants: room.getParticipantsList(),
      activity,
    });
  });
}
