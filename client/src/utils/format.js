export function formatTime(seconds = 0) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Lets the "Join Room" input accept either a bare code or a pasted
// invite link like https://sync-tube.vercel.app/room/ABX72K.
export function extractRoomCodeFromInput(input = '') {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/room\/([a-zA-Z0-9]{6})/);
  if (urlMatch) return urlMatch[1].toUpperCase();

  const bareCode = trimmed.match(/^[a-zA-Z0-9]{6}$/);
  return bareCode ? trimmed.toUpperCase() : trimmed.toUpperCase();
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
