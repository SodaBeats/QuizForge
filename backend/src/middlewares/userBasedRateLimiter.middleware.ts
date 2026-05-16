import { redis } from './redis.js';
import type { Request, Response, NextFunction } from 'express';

export function userBasedRateLimiter(windowSizeSec: number, limit: number) {
  const luaScript = `
    local current = redis.call("INCR", KEYS[1])
    if current == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    return current
  `;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientKey = `ratelimit:user:${req.user.id}`;
      const counter = (await redis.eval(
        luaScript,
        1,
        clientKey,
        windowSizeSec,
      )) as number;

      if (counter > limit) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, try again later',
        });
      }

      next();
    } catch (err) {
      console.error('Inner redis error: ', err);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong with the user-based limiter',
      });
    }
  };
}
