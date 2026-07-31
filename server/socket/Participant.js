import { ROLES } from '../constants/roles.js';

const AVATAR_COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#A3E635',
  '#34D399', '#22D3EE', '#60A5FA', '#A78BFA',
  '#F472B6', '#FB7185',
];

function pickAvatarColor(username) {
  // Deterministic so the same username always gets the same color
  // within a session, instead of a random one on every render.
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Represents one connected user inside a room. `participantId` is the
// STABLE identity (generated client-side, persisted in localStorage,
// sent on every join_room call) - `socketId` is just "whichever live
// connection currently belongs to this participant" and is expected
// to change across page refreshes/reconnects. Everything that targets
// a specific person (assign_role, remove_participant, transfer_host)
// must key off participantId, never socketId, or it silently breaks
// the moment that person refreshes.
export class Participant {
  constructor({ participantId, socketId, username, role = ROLES.PARTICIPANT }) {
    this.participantId = participantId;
    this.socketId = socketId;
    this.username = username;
    this.role = role;
    this.avatarColor = pickAvatarColor(username);
    this.joinedAt = Date.now();
    this.isOnline = true;
  }

  toJSON() {
    return {
      participantId: this.participantId,
      socketId: this.socketId,
      username: this.username,
      role: this.role,
      avatarColor: this.avatarColor,
      joinedAt: this.joinedAt,
      isOnline: this.isOnline,
    };
  }
}
