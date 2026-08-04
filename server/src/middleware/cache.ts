import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import logger from '../utils/logger';

export function cacheMiddleware(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const redis = getRedis();
    if (!redis) return next();

    const key = `cache:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        logger.info('Cache HIT', { key });
        res.json(JSON.parse(cached));
        return;
      }
      logger.info('Cache MISS', { key });
    } catch {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (redis && res.statusCode === 200) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

export async function invalidateCache(patterns: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  for (const pattern of patterns) {
    try {
      const keys = await redis.keys(`cache:${pattern}`);
      if (keys.length > 0) await redis.del(...keys);
      logger.info('Cache invalidated', { pattern, count: keys.length });
    } catch (err) {
      logger.warn('Cache invalidation failed', { pattern, error: (err as Error).message });
    }
  }
}
