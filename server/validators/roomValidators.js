import validator from 'validator';

const USERNAME_MIN = 2;
const USERNAME_MAX = 20;
const ROOM_CODE_LENGTH = 6;

export function validateUsername(username) {
  if (typeof username !== 'string') return 'Username is required.';

  const trimmed = username.trim();
  if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
    return `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters.`;
  }
  if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) {
    return 'Username can only contain letters, numbers, spaces, and underscores.';
  }
  return null; // null = valid
}

export function validateRoomCode(code) {
  if (typeof code !== 'string') return 'Room code is required.';
  const trimmed = code.trim();
  if (trimmed.length !== ROOM_CODE_LENGTH) {
    return `Room code must be ${ROOM_CODE_LENGTH} characters.`;
  }
  if (!validator.isAlphanumeric(trimmed)) {
    return 'Room code must be alphanumeric.';
  }
  return null;
}

export function sanitizeText(text, maxLength = 500) {
  if (typeof text !== 'string') return '';
  return validator.escape(text.trim()).slice(0, maxLength);
}
