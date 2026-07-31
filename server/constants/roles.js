// Central place for role names and what each role is allowed to do.
// Keeping this as plain objects (not classes) keeps it easy to read
// and easy to reason about during a code walkthrough.

export const ROLES = {
  HOST: 'host',
  MODERATOR: 'moderator',
  PARTICIPANT: 'participant',
  VIEWER: 'viewer',
};

// Actions that require elevated permissions.
export const PERMISSIONS = {
  CONTROL_PLAYBACK: 'control_playback', // play, pause, seek, change video
  ASSIGN_ROLE: 'assign_role',
  REMOVE_PARTICIPANT: 'remove_participant',
  TRANSFER_HOST: 'transfer_host',
  MANAGE_ROOM_SETTINGS: 'manage_room_settings',
};

// Maps each role to the permissions it has.
// Host has everything. Moderator can control playback but not manage
// people. Participant/Viewer are watch-only (Viewer is intentionally
// identical to Participant - the assignment asked for it as an alias).
const ROLE_PERMISSIONS = {
  [ROLES.HOST]: [
    PERMISSIONS.CONTROL_PLAYBACK,
    PERMISSIONS.ASSIGN_ROLE,
    PERMISSIONS.REMOVE_PARTICIPANT,
    PERMISSIONS.TRANSFER_HOST,
    PERMISSIONS.MANAGE_ROOM_SETTINGS,
  ],
  [ROLES.MODERATOR]: [PERMISSIONS.CONTROL_PLAYBACK],
  [ROLES.PARTICIPANT]: [],
  [ROLES.VIEWER]: [],
};

export function roleHasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Priority order used when auto-transferring host on disconnect.
export const HOST_TRANSFER_PRIORITY = [
  ROLES.MODERATOR,
  ROLES.PARTICIPANT,
  ROLES.VIEWER,
];
