// Single source of truth for every Socket.IO event name.
// The client has an identical copy in src/constants/socketEvents.js -
// keeping them as plain string constants (instead of a shared package)
// keeps the project simple to set up, at the cost of keeping both files
// in sync manually. Worth mentioning in a walkthrough as a trade-off.

export const SOCKET_EVENTS = {
  // Connection lifecycle
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  DISCONNECT: 'disconnect',

  // Playback sync
  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  SYNC_STATE: 'sync_state',

  // Roles & moderation
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',

  // Chat & reactions
  CHAT_MESSAGE: 'chat_message',
  TYPING: 'typing',
  EMOJI_REACTION: 'emoji_reaction',

  // Broadcasts (server -> clients)
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROLE_UPDATED: 'role_updated',
  PARTICIPANT_REMOVED: 'participant_removed',
  HOST_CHANGED: 'host_changed',
  ROOM_UPDATED: 'room_updated',
  ACTIVITY_LOG: 'activity_log',
  ERROR: 'error_event',
};
