import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

const redisEvalMock = jest.fn<
  (...args: (string | number)[]) => Promise<number>
>();

jest.unstable_mockModule('../../middlewares/redis.js', () => ({
  redis: { eval: redisEvalMock },
}));

const { ipRateLimiter } = await import(
  '../../middlewares/ipBasedRateLimiter.middleware.js'
);
const { userBasedRateLimiter } = await import(
  '../../middlewares/userBasedRateLimiter.middleware.js'
);

let originalNodeEnv: 'development' | 'production' | 'test';

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV;
  redisEvalMock.mockReset();
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
});

describe('rate limiters', () => {
  it('bypasses the IP limiter in development', async () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn<() => void>();

    await ipRateLimiter(60, 10)(
      { ip: '192.0.2.1' } as Request,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(redisEvalMock).not.toHaveBeenCalled();
  });

  it('bypasses the user limiter in development', async () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn<() => void>();

    await userBasedRateLimiter(60, 10)(
      { user: { id: 7, email: 'dev@example.com', role: 'student' } } as Request,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(redisEvalMock).not.toHaveBeenCalled();
  });

  it('continues to use Redis outside development', async () => {
    process.env.NODE_ENV = 'test';
    redisEvalMock.mockResolvedValue(1);

    const ipNext = jest.fn<() => void>();
    await ipRateLimiter(60, 10)(
      { ip: '192.0.2.1' } as Request,
      {} as Response,
      ipNext,
    );

    const userNext = jest.fn<() => void>();
    await userBasedRateLimiter(60, 10)(
      { user: { id: 7, email: 'dev@example.com', role: 'student' } } as Request,
      {} as Response,
      userNext,
    );

    expect(redisEvalMock).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      1,
      'ratelimit:192.0.2.1',
      60,
    );
    expect(redisEvalMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      1,
      'ratelimit:user:7',
      60,
    );
    expect(ipNext).toHaveBeenCalledTimes(1);
    expect(userNext).toHaveBeenCalledTimes(1);
  });
});
