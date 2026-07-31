import { roomManager } from '../RoomManager.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { sanitizeText } from '../../validators/roomValidators.js';
import { nanoid } from 'nanoid';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '😮', '👀'];

function emitError(socket, message) {
  socket.emit(SOCKET_EVENTS.ERROR, { message });
}

export function registerChatHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, ({ text }) => {
    const room = roomManager.getRoom(socket.data.roomCode);
    if (!room) return emitError(socket, 'Room not found.');
    if (!room.settings.chatEnabled) return emitError(socket, 'Chat is disabled in this room.');

    const clean = sanitizeText(text, 500);
    if (!clean) return;

    const message = {
      id: nanoid(8),
      username: socket.data.username,
      text: clean,
      sentAt: Date.now(),
    };

    room.addChatMessage(message);
    io.to(room.code).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
  });

  socket.on(SOCKET_EVENTS.TYPING, ({ isTyping }) => {
    const room = roomManager.getRoom(socket.data.roomCode);
    if (!room) return;

    socket.to(room.code).emit(SOCKET_EVENTS.TYPING, {
      username: socket.data.username,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on(SOCKET_EVENTS.EMOJI_REACTION, ({ emoji }) => {
    const room = roomManager.getRoom(socket.data.roomCode);
    if (!room) return emitError(socket, 'Room not found.');
    if (!room.settings.reactionsEnabled) return;
    if (!ALLOWED_EMOJIS.includes(emoji)) return;

    io.to(room.code).emit(SOCKET_EVENTS.EMOJI_REACTION, {
      id: nanoid(8),
      emoji,
      username: socket.data.username,
      sentAt: Date.now(),
    });
  });
}
