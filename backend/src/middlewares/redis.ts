import { Redis } from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 5,
  connectTimeout: 10000,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});
redis.on('ready', () => {
  console.log('Redis connection established');
});
process.on('SIGTERM', async () => {
  await redis.quit();
});
process.on('SIGINT', async () => {
  await redis.quit();
});
