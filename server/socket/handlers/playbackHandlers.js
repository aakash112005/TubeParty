import { roomManager } from '../RoomManager.js';
import { PermissionManager } from '../PermissionManager.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { extractYouTubeId } from '../../utils/youtube.js';

function emitError(socket, message) {
  socket.emit(SOCKET_EVENTS.ERROR, { message });
}

// Looks up the room + participant for the current socket and checks
// they're allowed to control playback. Returns null (and emits an
// error) if the request should be rejected, otherwise returns
// { room, participant } so the caller can proceed.
function authorizePlaybackAction(socket) {
  const { roomCode, participantId } = socket.data;
  const room = roomManager.getRoom(roomCode);
  if (!room) {
    emitError(socket, 'Room not found.');
    return null;
  }

  const participant = room.getParticipantById(participantId);
  if (!participant) {
    emitError(socket, 'You are not part of this room.');
    return null;
  }

  if (!PermissionManager.canControlPlayback(participant.role)) {
    emitError(socket, 'You do not have permission to control playback.');
    return null;
  }

  return { room, participant };
}

export function registerPlaybackHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.PLAY, ({ currentTime }) => {
    const auth = authorizePlaybackAction(socket);
    if (!auth) return;
    const { room } = auth;

    room.updatePlaybackState({ isPlaying: true, currentTime });
    socket.to(room.code).emit(SOCKET_EVENTS.PLAY, {
      currentTime: room.currentVideo.currentTime,
      updatedAt: room.currentVideo.updatedAt,
    });
  });

  socket.on(SOCKET_EVENTS.PAUSE, ({ currentTime }) => {
    const auth = authorizePlaybackAction(socket);
    if (!auth) return;
    const { room } = auth;

    room.updatePlaybackState({ isPlaying: false, currentTime });
    socket.to(room.code).emit(SOCKET_EVENTS.PAUSE, {
      currentTime: room.currentVideo.currentTime,
      updatedAt: room.currentVideo.updatedAt,
    });
  });

  socket.on(SOCKET_EVENTS.SEEK, ({ currentTime }) => {
    const auth = authorizePlaybackAction(socket);
    if (!auth) return;
    const { room } = auth;

    room.updatePlaybackState({ currentTime });
    socket.to(room.code).emit(SOCKET_EVENTS.SEEK, {
      currentTime: room.currentVideo.currentTime,
      updatedAt: room.currentVideo.updatedAt,
    });
  });

  socket.on(SOCKET_EVENTS.CHANGE_VIDEO, ({ videoUrlOrId }) => {
    const auth = authorizePlaybackAction(socket);
    if (!auth) return;
    const { room, participant } = auth;

    const videoId = extractYouTubeId(videoUrlOrId);
    if (!videoId) {
      return emitError(socket, 'That does not look like a valid YouTube URL or video ID.');
    }

    room.updatePlaybackState({ videoId, isPlaying: true, currentTime: 0 });

    const activity = room.addActivity({
      type: 'video_changed',
      message: `${participant.username} changed the video`,
    });

    io.to(room.code).emit(SOCKET_EVENTS.CHANGE_VIDEO, {
      videoId,
      currentTime: 0,
      isPlaying: true,
      activity,
    });
  });
}
