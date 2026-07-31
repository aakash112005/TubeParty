import { customAlphabet } from 'nanoid';

// Avoid ambiguous characters (0/O, 1/I/L) so codes are easy to read
// out loud or type on a phone.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET, 6);

export function generateRoomCode() {
  return nanoid();
}
