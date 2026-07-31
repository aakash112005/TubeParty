import { PERMISSIONS, roleHasPermission } from '../constants/roles.js';

// Every socket handler that mutates room state goes through here
// first. Centralizing it means there is exactly one place that
// decides "can this role do this" - the frontend hides buttons for
// UX, but this is what actually enforces it.
export class PermissionManager {
  static canControlPlayback(role) {
    return roleHasPermission(role, PERMISSIONS.CONTROL_PLAYBACK);
  }

  static canAssignRole(role) {
    return roleHasPermission(role, PERMISSIONS.ASSIGN_ROLE);
  }

  static canRemoveParticipant(role) {
    return roleHasPermission(role, PERMISSIONS.REMOVE_PARTICIPANT);
  }

  static canTransferHost(role) {
    return roleHasPermission(role, PERMISSIONS.TRANSFER_HOST);
  }

  static canManageRoomSettings(role) {
    return roleHasPermission(role, PERMISSIONS.MANAGE_ROOM_SETTINGS);
  }
}
