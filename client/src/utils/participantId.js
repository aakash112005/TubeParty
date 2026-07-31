// A page refresh creates a brand-new Socket.IO connection (and thus a
// brand-new socket.id), but the *person* hasn't changed. Without some
// identity that survives the refresh, the server has no way to tell
// "this is the same user reconnecting" apart from "this is a new
// stranger with the same name" - which is exactly what caused role
// loss, false "username taken" errors, and premature host hand-off on
// refresh.
//
// This generates one random id per (browser, room) pair the first
// time a room is joined, and persists it in localStorage so every
// subsequent join_room call - including ones from a hard refresh -
// sends the same id. It's intentionally scoped per room code (not
// global) so joining a different room later gets a fresh identity
// instead of confusingly reusing one from an unrelated room.
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getStableParticipantId(roomCode) {
  const key = `synctube:participant-id:${roomCode}`;

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const id = generateId();
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    // localStorage unavailable (private browsing, etc.) - fall back to
    // an in-memory id. Refreshing will lose identity continuity in
    // this case, which is an acceptable degradation since there's
    // nowhere durable to store it anyway.
    return generateId();
  }
}
