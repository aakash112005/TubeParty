import { roomManager } from '../socket/RoomManager.js';
import { Room } from '../models/Room.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';
import { validateUsername } from '../validators/roomValidators.js';
import { logger } from '../utils/logger.js';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

// Real-time room joining happens over the socket (join_room event) -
// these REST endpoints only handle the two things that make sense as
// plain HTTP requests: creating a room before any socket exists, and
// letting the "Join Room" page check a code is valid before the user
// even opens a socket connection.

export async function createRoom(req, res) {
  const { username } = req.body;

  const usernameError = validateUsername(username);
  if (usernameError) {
    return res.status(400).json({ success: false, message: usernameError });
  }

  let code;
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
    const candidate = generateRoomCode();
    if (!roomManager.hasRoom(candidate)) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    return res.status(500).json({ success: false, message: 'Could not generate a unique room code. Try again.' });
  }

  // Register the room in memory immediately so the host's socket can
  // join it right after. The first socket to call join_room for this
  // code becomes host (see socket/handlers/roomHandlers.js).
  roomManager.createRoom(code, username.trim());

  // Persist room metadata so the code keeps resolving even if the
  // server restarts. This is best-effort: if Mongo isn't configured
  // the app still works, just without that durability.
  try {
    await Room.create({ code, hostUsername: username.trim() });
  } catch (error) {
    logger.warn('Could not persist room to database:', error.message);
  }

  return res.status(201).json({
    success: true,
    data: {
      roomCode: code,
      inviteLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/room/${code}`,
    },
  });
}

export async function checkRoom(req, res) {
  const { code } = req.params;
  const room = roomManager.getRoom(code);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Room not found.' });
  }

  return res.status(200).json({
    success: true,
    data: {
      code: room.code,
      hostUsername: room.hostUsername,
      participantCount: room.participantCount,
      hasVideo: Boolean(room.currentVideo.videoId),
    },
  });
}

export function healthCheck(req, res) {
  res.status(200).json({
    success: true,
    status: 'ok',
    activeRooms: roomManager.roomCount,
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
