import { Redis } from 'ioredis';
import type { Request, Response, NextFunction } from 'express';

export function appRateLimiter(windowSizeMillisec: number, limit: number) {
  const redis = new Redis();
  const windowSizeSeconds = Math.floor(windowSizeMillisec / 1000);
  const requestCap = limit;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counter = await redis.incr('reqTotal');
      console.log('The rate limiter code is running');
      if (counter === 1) {
        await redis.expire('reqTotal', windowSizeSeconds);
      }
      if (counter > requestCap) {
        console.log('exceeded');
        return res.status(429).json({
          success: false,
          message: 'Too many requests, try again later',
        });
      }
      next();
    } catch (error) {
      console.error('Inner redis error: ', error);
      return res
        .status(500)
        .json({ success: false, message: 'Redis error, try again later' });
    }
  };
}
