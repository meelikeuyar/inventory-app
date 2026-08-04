import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '../utils/token';
import logger from '../utils/logger';

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── Socket authentication middleware ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    logger.info('Socket connected', { socketId: socket.id, userId });

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id, userId });
    });
  });

  logger.info('Socket.io initialized (with auth)');
  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export interface SocketNotification {
  type: 'inventory_created' | 'inventory_updated' | 'inventory_deleted' | 'project_created' | 'project_deleted' | 'site_created' | 'site_deleted';
  data: {
    name: string;
    user: string;
    timestamp: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  };
}

export function emitNotification(notification: SocketNotification): void {
  if (io) {
    io.emit('notification', notification);
    logger.info('Socket notification emitted', { type: notification.type });
  }
}
