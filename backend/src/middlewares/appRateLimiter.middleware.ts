import { redis } from './redis.js';
import type { Request, Response, NextFunction } from 'express';

export function ipRateLimiter(windowSizeMillisec: number, limit: number) {
  const windowSizeSeconds = Math.floor(windowSizeMillisec / 1000);

  // lua script for atomicity
  const luaScript = `
    local current = redis.call("INCR", KEYS[1])
    if current == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    return current
  `;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientIp = (req.ip ?? 'unknown').replace(/^::ffff:/, '');
      const clientKey = `ratelimit:${clientIp}`;

      const counter = (await redis.eval(
        luaScript,
        1,
        clientKey,
        windowSizeSeconds,
      )) as number;

      if (counter > limit) {
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
