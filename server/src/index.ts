import http from 'http';
import app from './app';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { initRedis } from './config/redis';
import logger from './utils/logger';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

function gracefulShutdown(signal: string) {
  logger.info(`${signal} received`);
  mongoose.connection.close().then(() => process.exit(0));
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function start() {
  await connectDB();
  initRedis();
  server.listen(PORT, () => logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' }));
}
start().catch((err) => { logger.error('Failed to start', err); process.exit(1); });
