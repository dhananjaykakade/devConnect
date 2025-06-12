import { Request, Response,RequestHandler, NextFunction } from 'express'
import prisma from '../../helper/prisma.helper'
import ResponseHandler from '../../utils/ApiResponse'
import { AuthenticatedRequest } from '../../middlewares/auth.middleware'
import {redis} from '../../utils/redis'

export const searchUsers: RequestHandler = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const query = req.query.q?.toString().trim();

    if (!query) {
       ResponseHandler.validationError(res, 'Search query (q) is required');
       return
    }

     const cacheKey = `search:users:${query.toLowerCase()}`;

    // Try to get cached data
const cachedUsers: any = await redis.get(cacheKey);
if (cachedUsers) {
  ResponseHandler.success(res, 200, 'Users fetched successfully (cache)', cachedUsers);
  return;
}


 const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
      },
      take: 10,
    });
await redis.set(cacheKey, JSON.stringify(users), { ex: 60 });
    ResponseHandler.success(res, 200, 'Users fetched successfully', users);
  } catch (error) {
    next(error);
  }
};


export const followUser: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const followerId = req.user?.id;
    if (!followerId) {
       ResponseHandler.unauthorized(res, 'User not authenticated');
       return
    }
    const followingId = req.params.userId;
    if (!followingId) {
       ResponseHandler.validationError(res, 'User ID is missing.');
       return
    }


    if (followerId === followingId) {
       ResponseHandler.validationError(res, 'You cannot follow yourself.');
    }

    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
       ResponseHandler.validationError(res, 'Already following this user.');
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    
await redis.del(`follow:${followerId}:follows:${followingId}`);
    await redis.del(`followers:${followingId}`);
    await redis.del(`following:${followerId}`);

     ResponseHandler.success(res, 200, 'Followed user successfully');
  } catch (error) {
     ResponseHandler.handleError(error, res);
  }
};


export const unfollowUser: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const followerId = req.user?.id;
    const followingId = req.params.userId;

    if (!followerId || !followingId) {
     ResponseHandler.validationError(res, 'User ID is missing.');
    }

    const followEntry = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (!followEntry) {
     ResponseHandler.validationError(res, 'You are not following this user.');
     return
    }

    await prisma.follow.delete({
      where: {
        id: followEntry.id,
      },
    });

    await redis.del(`follow:${followerId}:follows:${followingId}`);
        await redis.del(`followers:${followingId}`);
    await redis.del(`following:${followerId}`);

   ResponseHandler.success(res, 200, 'Unfollowed user successfully');
  } catch (error) {
   ResponseHandler.handleError(error, res);
  }
};

export const getFollowers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const cacheKey = `user:${userId}:followers`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {

      ResponseHandler.success(res, 200, 'Followers fetched successfully (cache)', cached);
      return 
    }

    // Fetch from DB
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            name: true,
          },
        },
      },
    });

    const formatted = followers.map((f) => f.follower);

    // Cache for 60 seconds
    await redis.set(cacheKey, JSON.stringify(formatted), { ex: 60 });

    ResponseHandler.success(res, 200, 'Followers fetched successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const getFollowing: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const cacheKey = `user:${userId}:following`;

    // Check if data is in cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      ResponseHandler.success(res, 200, 'Following fetched successfully (cache)', cached);
      return 
    }

    // Fetch from database
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            name: true,
          },
        },
      },
    });

    const formatted = following.map((f) => f.following);

    // Store in Redis for 60 seconds
    await redis.set(cacheKey, JSON.stringify(formatted), { ex: 60 });

    ResponseHandler.success(res, 200, 'Following fetched successfully', formatted);
  } catch (error) {
    next(error);
  }
};
export const checkIfFollowing: RequestHandler = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const { userId, targetUserId } = req.params;

        const cacheKey = `follow:${userId}:follows:${targetUserId}`;

    // Try fetching from Redis first
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult !== null) {
      const isFollowing = cachedResult === '1';
      ResponseHandler.success(res, 200, 'Follow status fetched (cache)', { isFollowing });
      return 
    }

    const follow = await prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    const isFollowing = !!follow;

    await redis.set(cacheKey, isFollowing ? '1' : '0', { ex: 60 });

    ResponseHandler.success(res, 200, 'Follow status fetched', { isFollowing });
  } catch (error) {
    next(error);
  }
};