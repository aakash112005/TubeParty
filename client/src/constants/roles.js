export const ROLES = {
  HOST: 'host',
  MODERATOR: 'moderator',
  PARTICIPANT: 'participant',
  VIEWER: 'viewer',
};

// Single source of truth for how each role is displayed - label,
// color, and which icon key to render. RoleBadge.jsx maps iconKey to
// an actual react-icons component so this file stays framework-light.
export const ROLE_META = {
  [ROLES.HOST]: {
    label: 'Host',
    iconKey: 'crown',
    className: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  },
  [ROLES.MODERATOR]: {
    label: 'Moderator',
    iconKey: 'shield',
    className: 'text-primary bg-primary/10 border-primary/30',
  },
  [ROLES.PARTICIPANT]: {
    label: 'Participant',
    iconKey: 'circle',
    className: 'text-accent bg-accent/10 border-accent/30',
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    iconKey: 'eye',
    className: 'text-muted bg-muted/10 border-muted/30',
  },
};

export const ASSIGNABLE_ROLES = [ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER];

export function canControlPlayback(role) {
  return role === ROLES.HOST || role === ROLES.MODERATOR;
}

export function isHost(role) {
  return role === ROLES.HOST;
}
