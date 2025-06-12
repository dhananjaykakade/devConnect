import { redis } from '../utils/redis';
import ResponseHandler from '../utils/ApiResponse';
import { Request, Response, NextFunction } from 'express';

const WINDOW_IN_SECONDS = 60; // 1 min window
const MAX_REQUESTS = 10;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;

  const key = `ratelimit:${ip}`;
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, WINDOW_IN_SECONDS);
  }

  if (requests > MAX_REQUESTS) {
    ResponseHandler.tooManyRequests(res, 'Too many requests, please try again later')
    return
  }

  next();
};
