// Mirrors server/constants/socketEvents.js. Keeping this as a plain
// synced constants file (rather than a shared npm workspace package)
// is a deliberate simplicity trade-off for a project this size.
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  DISCONNECT: 'disconnect',

  PLAY: 'play',
  PAUSE: 'pause',
  SEEK: 'seek',
  CHANGE_VIDEO: 'change_video',
  SYNC_STATE: 'sync_state',

  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',

  CHAT_MESSAGE: 'chat_message',
  TYPING: 'typing',
  EMOJI_REACTION: 'emoji_reaction',

  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROLE_UPDATED: 'role_updated',
  PARTICIPANT_REMOVED: 'participant_removed',
  HOST_CHANGED: 'host_changed',
  ROOM_UPDATED: 'room_updated',
  ACTIVITY_LOG: 'activity_log',
  ERROR: 'error_event',
};
