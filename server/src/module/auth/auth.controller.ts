import { Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';

import ResponseHandler from '../../utils/ApiResponse';
import { registerSchema,loginSchema,updateProfileSchema } from './auth.validation';
import prisma from '../../helper/prisma.helper';
import {  verifyRefreshToken,
  createTokens,} from './auth.utils';
  import {AuthenticatedRequest,getRefreshTokenFromRequest } from '../../middlewares/auth.middleware';
  import { redis } from '../../utils/redis';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 */
  export const register: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Validate input with Zod schema
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors = parsed.error.format();
      const flatErrors = Object.entries(formattedErrors)
        .filter(([key]) => key !== "_errors")
        .reduce((acc, [key, val]) => {
          acc[key] = !val || Array.isArray(val)
            ? 'Invalid'
            : val._errors?.[0] || 'Invalid';
          return acc;
        }, {} as Record<string, string>);

      ResponseHandler.validationError(res, 'Invalid input', flatErrors);
      return;
    }

    const { username, email, password,name } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      ResponseHandler.conflict(res, 'User already exists with that email or username');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        name,
        password: hashedPassword,
      },
    });

    // Sign JWT
const { accessToken, refreshToken } = await createTokens({
  id: newUser.id,
  role: newUser.role,
  name: newUser.name ,
  username: newUser.username 
})

    // Success response
    ResponseHandler.sendAccessToken(res, newUser, accessToken, refreshToken )
    return;
  } catch (error) {
    ResponseHandler.handleError(error, res);
    return;
  }
};


export const refreshToken:RequestHandler = async (req: Request, res: Response) => {
  // Get refresh token from request
  const refreshToken = getRefreshTokenFromRequest(req)
  console.log('Refresh token:', refreshToken)


  if (!refreshToken) {
      ResponseHandler.badRequest(res, 'Refresh token missing')
    return
  }

  try {
    const payload = verifyRefreshToken(refreshToken)

    // Check token exists in DB and not expired
    const stored = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, userId: payload.id },
    })
    if (!stored || stored.expiresAt < new Date()) {
        ResponseHandler.unauthorized(res, 'Refresh token invalid or expired')
      return 
    }

    // rotate: delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } })

    const { accessToken, refreshToken: newRefresh } = await createTokens({
      id: payload.id,
      role: payload.role,
      name: payload.name,
      username: payload.username
    })

    ResponseHandler.sendAccessToken(res, payload, accessToken, newRefresh)
    return 
  } catch (err) {
      ResponseHandler.unauthorized(res, 'Refresh token invalid')
    return 
  }
}
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: Test@1234
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login:RequestHandler = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Validate body
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
        ResponseHandler.validationError(res, 'Invalid input', parsed.error.format())
      return 
    }

    const { email, password } = parsed.data

    // 2️⃣ Find user by email
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        ResponseHandler.unauthorized(res, 'Invalid email or password')
      return 
    }

    // 3️⃣ Verify password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
        ResponseHandler.unauthorized(res, 'Invalid email or password')
      return 
    }

    // 4️⃣ Issue tokens (access + refresh) & persist refresh token
    const { accessToken, refreshToken } = await createTokens({
      id: user.id,
      role: user.role,
      name: user.name ,
      username: user.username
    })

    // 5️⃣ Send response
    ResponseHandler.sendAccessToken(res, user, accessToken, refreshToken)
    return 
  } catch (error) {
      ResponseHandler.handleError(error, res)
    return 
  }
}

export const updateProfile: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return 
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      ResponseHandler.validationError(res, 'Invalid input', parsed.error.format());
      return
    }

    const { username, bio, avatar, techStack, name } = parsed.data;

    // Fetch current user to compare username
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (!currentUser) {
      ResponseHandler.notFound(res, 'User not found');
      return 
    }

    // If username is changed, check if it's already taken
    if (username !== currentUser.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          username,
        },
      });

      if (existingUser) {
        ResponseHandler.conflict(res, 'Username already taken');
        return 
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        name,
        bio,
        avatar,
        techStack: techStack || [],
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        techStack: true,
      },
    });

    // Invalidate cache
    const cacheKey = `user:profile:${userId}`;
    await redis.del(cacheKey);

    ResponseHandler.success(res, 200, 'Profile updated successfully', updatedUser);
    return 
  } catch (error) {
    ResponseHandler.handleError(error, res);
    return 
  }
};


//create get profile endpoint
export const getProfile: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id; // 👈 from JWT middleware
    
        if (!userId) {
        ResponseHandler.unauthorized(res, 'User not authenticated');
        return;
        }
           const cacheKey = `user:profile:${userId}`;
    const cachedProfile = await redis.get(cacheKey);

    if (cachedProfile) {
      ResponseHandler.success(res, 200, 'Profile retrieved successfully (from cache)', cachedProfile);
      return 
    }
    
        const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            bio: true,
            avatar: true,
            techStack: true,
        },
        });
    
        if (!user) {
        ResponseHandler.notFound(res, 'User not found');
        return;
        }
     await redis.set(cacheKey, JSON.stringify(user), { ex: 300 });
        ResponseHandler.success(res, 200, 'Profile retrieved successfully', user);
        return;
    } catch (error) {
        ResponseHandler.handleError(error, res);
        return;
    }
    }

//create logout endpoint
export const logout: RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id; // 👈 from JWT middleware
    
        if (!userId) {
        ResponseHandler.unauthorized(res, 'User not authenticated');
        return;
        }
    
        // Delete all refresh tokens for the user
        await prisma.refreshToken.deleteMany({
        where: { userId },
        });

          res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });                  
    
        ResponseHandler.success(res, 200, 'Logged out successfully');
        return;
    } catch (error) {
        ResponseHandler.handleError(error, res);
        return;
    }
    }


//get user by id endpoint
export const getUserById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      ResponseHandler.badRequest(res, 'User ID is required');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        techStack: true,
      },
    });

    if (!user) {
      ResponseHandler.notFound(res, 'User not found');
      return;
    }

    ResponseHandler.success(res, 200, 'User retrieved successfully', user);
    return;
  } catch (error) {
    ResponseHandler.handleError(error, res);
    return;
  }
}