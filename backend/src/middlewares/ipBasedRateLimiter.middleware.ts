import { redis } from './redis.js';
import type { Request, Response, NextFunction } from 'express';

export function ipRateLimiter(windowSizeSeconds: number, limit: number) {
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
      const clientIp = req.ip?.replace(/^::ffff:/, '');
      if (!clientIp) {
        console.error('IP address unavailable, blocking request');
        return res
          .status(400)
          .json({ success: false, message: 'Unable to identify client IP' });
      }

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
