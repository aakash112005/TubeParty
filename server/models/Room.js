import mongoose from 'mongoose';

// This model only stores what a room "was" - enough that a room code
// keeps working if the server restarts, and enough for a "recent
// rooms" style lookup. Live, fast-changing data (who's connected right
// now, socket ids, typing indicators) intentionally lives in memory
// inside socket/RoomManager.js instead of the database, because:
//   1. That data is only useful while sockets are connected anyway.
//   2. Writing to Mongo on every play/pause/seek would add latency to
//      the exact feature (sync) that most needs to feel instant.
const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    hostUsername: {
      type: String,
      required: true,
    },
    currentVideo: {
      videoId: { type: String, default: null },
      isPlaying: { type: Boolean, default: false },
      currentTime: { type: Number, default: 0 },
    },
    settings: {
      chatEnabled: { type: Boolean, default: true },
      reactionsEnabled: { type: Boolean, default: true },
      moderatorsCanChangeVideo: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60, 
    },
  },
  { timestamps: true }
);

export const Room = mongoose.model('Room', roomSchema);
