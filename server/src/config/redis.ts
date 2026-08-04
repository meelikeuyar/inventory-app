import Redis from 'ioredis';
import logger from '../utils/logger';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  return redis;
}

export function initRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info('REDIS_URL not set — cache disabled');
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.warn('Redis error', { error: err.message }));

    return redis;
  } catch (err) {
    logger.warn('Redis init failed — cache disabled', { error: (err as Error).message });
    return null;
  }
}
