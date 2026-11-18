import 'dotenv/config';
import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is not set');
}

export const redis = new Redis(redisUrl, {
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
  try {
    console.log('Received "SIGTERM" signal, closing Redis connection...');
    await redis.quit();
  } catch (err) {
    console.error('Error during Redis shutdown: ', err);
  } finally {
    process.exit(0);
  }
});
process.on('SIGINT', async () => {
  try {
    console.log('Received "SIGINT" signal, closing Redis connection...');
    await redis.quit();
  } catch (err) {
    console.error('Error during Redis shutdown: ', err);
  } finally {
    process.exit(0);
  }
});
