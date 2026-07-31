import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import roomRoutes from './routes/roomRoutes.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { initializeSocketServer } from './socket/index.js';
import { roomManager } from './socket/RoomManager.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ROOM_INACTIVITY_TIMEOUT_MS =
  Number(process.env.ROOM_INACTIVITY_TIMEOUT_MINUTES || 60) * 60 * 1000;

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use('/api', apiRateLimiter);

// --- Routes ---
app.use('/api', roomRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

// --- Socket.IO ---
initializeSocketServer(io);

// --- Background cleanup: remove empty rooms after a period of
// inactivity so memory doesn't grow unbounded. ---
setInterval(() => {
  roomManager.cleanupInactiveRooms(ROOM_INACTIVITY_TIMEOUT_MS);
}, 5 * 60 * 1000);

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`SyncTube server running on port ${PORT}`);
  });
}

start();
