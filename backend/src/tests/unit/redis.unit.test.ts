import { jest } from '@jest/globals';

const redisConstructor = jest.fn();
jest.unstable_mockModule('ioredis', () => ({
  Redis: redisConstructor,
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalRedisUrl = process.env.REDIS_URL;
process.env.NODE_ENV = 'development';
delete process.env.REDIS_URL;

const { redis } = await import('../../middlewares/redis.js');

process.env.NODE_ENV = originalNodeEnv;
if (originalRedisUrl === undefined) {
  delete process.env.REDIS_URL;
} else {
  process.env.REDIS_URL = originalRedisUrl;
}

describe('redis middleware client', () => {
  it('does not require a URL or create a client in development', () => {
    expect(redis).toBeUndefined();
    expect(redisConstructor).not.toHaveBeenCalled();
  });
});
