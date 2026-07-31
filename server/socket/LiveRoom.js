import { ROLES, HOST_TRANSFER_PRIORITY } from '../constants/roles.js';

const MAX_CHAT_HISTORY = 100;
const MAX_ACTIVITY_LOG = 50;

// Holds everything about a room that only matters while people are
// actively connected: who's in it, current playback position, chat
// history for the session, and a short activity feed.
//
// IDENTITY MODEL (this is the piece that was missing before and
// caused most of the refresh/role bugs): participants are keyed by a
// STABLE `participantId` that the client generates once and persists
// in localStorage per room. `socketId` on a Participant is just "the
// live connection currently representing this participant" and is
// expected to change every time that browser tab reconnects (e.g. a
// page refresh). Nothing that targets a specific person should ever
// use socketId as a long-lived key - socket handlers look participants
// up via `socket.data.participantId` (set once at join time and valid
// for that connection's whole lifetime), not by scanning for socketId.
export class LiveRoom {
  constructor(code, hostUsername) {
    this.code = code;
    this.hostUsername = hostUsername;
    this.participants = new Map(); // participantId -> Participant
    this.pendingRemovals = new Map(); // participantId -> Timeout
    this.currentVideo = {
      videoId: null,
      isPlaying: false,
      currentTime: 0,
      updatedAt: Date.now(),
    };
    this.settings = {
      chatEnabled: true,
      reactionsEnabled: true,
      moderatorsCanChangeVideo: true,
    };
    this.chatMessages = [];
    this.activityLog = [];
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
  }

  touch() {
    this.lastActivityAt = Date.now();
  }

  // ---- Participant lookup / lifecycle ----

  addParticipant(participant) {
    this.participants.set(participant.participantId, participant);
    this.touch();
  }

  // Rebinds an existing participant to a new live socket connection
  // (called when a known participantId reconnects with a fresh
  // socket.id after a refresh).
  rebindSocket(participantId, newSocketId) {
    const participant = this.participants.get(participantId);
    if (!participant) return null;

    participant.socketId = newSocketId;
    participant.isOnline = true;
    this.touch();
    return participant;
  }

  removeParticipant(participantId) {
    this.cancelScheduledRemoval(participantId);
    const deleted = this.participants.delete(participantId);
    if (deleted) this.touch();
    return deleted;
  }

  getParticipantById(participantId) {
    return this.participants.get(participantId);
  }

  findByUsername(username, excludeParticipantId = null) {
    return [...this.participants.values()].find(
      (p) => p.participantId !== excludeParticipantId && p.username.toLowerCase() === username.toLowerCase()
    );
  }

  isUsernameTaken(username, excludeParticipantId = null) {
    return Boolean(this.findByUsername(username, excludeParticipantId));
  }

  getParticipantsList() {
    return [...this.participants.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => p.toJSON());
  }

  get participantCount() {
    return this.participants.size;
  }

  get isEmpty() {
    return this.participants.size === 0;
  }

  // ---- Reconnect grace period ----
  //
  // A raw socket 'disconnect' is ambiguous - it fires identically for
  // "the user closed the tab" and "the user refreshed the page". We
  // can't tell them apart at the moment it happens, so instead of
  // immediately removing the participant (and, if they were host,
  // immediately handing off ownership), we mark them offline and give
  // them a short grace window to reconnect with the same
  // participantId. Only if that window expires without a reconnect do
  // we treat it as a real departure.

  scheduleRemoval(participantId, delayMs, onExpire) {
    this.cancelScheduledRemoval(participantId);
    const timer = setTimeout(() => {
      this.pendingRemovals.delete(participantId);
      onExpire();
    }, delayMs);
    this.pendingRemovals.set(participantId, timer);
  }

  cancelScheduledRemoval(participantId) {
    const timer = this.pendingRemovals.get(participantId);
    if (timer) {
      clearTimeout(timer);
      this.pendingRemovals.delete(participantId);
    }
  }

  clearAllPendingRemovals() {
    for (const timer of this.pendingRemovals.values()) clearTimeout(timer);
    this.pendingRemovals.clear();
  }

  // ---- Playback state ----

  updatePlaybackState({ videoId, isPlaying, currentTime }) {
    if (videoId !== undefined) this.currentVideo.videoId = videoId;
    if (isPlaying !== undefined) this.currentVideo.isPlaying = isPlaying;
    if (currentTime !== undefined) this.currentVideo.currentTime = currentTime;
    this.currentVideo.updatedAt = Date.now();
    this.touch();
  }

  // Returns the *current* playback position, extrapolated forward by
  // however long has elapsed since the last play/pause/seek if the
  // video is playing. Without this, a client that joins (or
  // reconnects) 30 seconds after the last sync event would seek back
  // to that 30-second-old timestamp and appear to "restart" the video
  // - this is the root cause of the refresh/late-join sync bug.
  getCurrentVideoSnapshot() {
    const { videoId, isPlaying, currentTime, updatedAt } = this.currentVideo;
    if (!videoId) return { videoId: null, isPlaying: false, currentTime: 0, updatedAt: Date.now() };

    const elapsedSeconds = isPlaying ? (Date.now() - updatedAt) / 1000 : 0;
    return {
      videoId,
      isPlaying,
      currentTime: currentTime + elapsedSeconds,
      updatedAt: Date.now(),
    };
  }

  addChatMessage(message) {
    this.chatMessages.push(message);
    if (this.chatMessages.length > MAX_CHAT_HISTORY) {
      this.chatMessages.shift();
    }
    this.touch();
  }

  addActivity(entry) {
    const activity = { ...entry, timestamp: Date.now() };
    this.activityLog.push(activity);
    if (this.activityLog.length > MAX_ACTIVITY_LOG) {
      this.activityLog.shift();
    }
    return activity;
  }

  // Picks the next host when the current host leaves for good,
  // following Moderator -> Participant -> Viewer priority order.
  // Only considers participants who are currently online - someone
  // mid-refresh (offline, inside their own grace window) shouldn't be
  // handed the host role while their client isn't even connected.
  pickNextHost(excludeParticipantId) {
    const candidates = [...this.participants.values()].filter(
      (p) => p.participantId !== excludeParticipantId && p.isOnline
    );
    if (candidates.length === 0) return null;

    for (const role of HOST_TRANSFER_PRIORITY) {
      const candidate = candidates.find((p) => p.role === role);
      if (candidate) return candidate;
    }
    return candidates[0];
  }

  setHost(participant) {
    // Demote the previous host (if still present) to participant.
    for (const p of this.participants.values()) {
      if (p.role === ROLES.HOST) p.role = ROLES.PARTICIPANT;
    }
    participant.role = ROLES.HOST;
    this.hostUsername = participant.username;
    this.touch();
  }
}
