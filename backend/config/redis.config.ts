import Redis from 'ioredis';

import { Env } from '@start/env';

const redis = new Redis(Env.REDIS_URL);

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

export { redis };
