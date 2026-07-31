import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    logger.warn('MONGO_URI not set - skipping database connection. Rooms will not persist across restarts.');
    return;
  }

  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    // We don't crash the process - 's real-time features work
    // fully in-memory. MongoDB is only used to persist room metadata,
    // so the app degrades gracefully without it.
  }
}
