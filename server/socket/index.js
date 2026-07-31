import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerPlaybackHandlers } from './handlers/playbackHandlers.js';
import { registerModerationHandlers } from './handlers/moderationHandlers.js';
import { registerChatHandlers } from './handlers/chatHandlers.js';
import { logger } from '../utils/logger.js';

// Called once from server.js with the Socket.IO server instance.
// Every new connection gets each handler group registered on it -
// splitting by concern (room lifecycle / playback / moderation /
// chat) instead of one giant file keeps each piece easy to read and
// easy to point to individually during a walkthrough.
export function initializeSocketServer(io) {
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerPlaybackHandlers(io, socket);
    registerModerationHandlers(io, socket);
    registerChatHandlers(io, socket);
  });
}
