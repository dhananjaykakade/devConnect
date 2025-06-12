import { Redis } from '@upstash/redis';
import { config } from '../config/config.service';

export const redis = new Redis({
  url: config.redisUrl,
  token:  config.redisToken
});