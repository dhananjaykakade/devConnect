import { Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ResponseHandler from '../../utils/ApiResponse';
import { registerSchema,loginSchema } from './auth.validation';
import { config } from '../../config/config.service';
import prisma from '../../helper/prisma.helper';
import {  verifyRefreshToken,
  createTokens,} from './auth.utils';

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

    const { username, email, password } = parsed.data;

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
        password: hashedPassword,
      },
    });

    // Sign JWT
const { accessToken, refreshToken } = await createTokens({
  id: newUser.id,
  role: newUser.role,
})

    // Success response
    ResponseHandler.success(res, 201, 'User registered successfully', {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
   accessToken,
  refreshToken,
    });
    return;
  } catch (error) {
    ResponseHandler.handleError(error, res);
    return;
  }
};



export const refreshToken:RequestHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body           // or pull from cookie

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
    })

    ResponseHandler.success(res, 200, 'Token refreshed', {
        accessToken,
        refreshToken: newRefresh,
    })
    return 
  } catch (err) {
      ResponseHandler.unauthorized(res, 'Refresh token invalid')
    return 
  }
}

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
    })

    // 5️⃣ Send response
    ResponseHandler.success(res, 200, 'Login successful', {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken,
    })
    return 
  } catch (error) {
      ResponseHandler.handleError(error, res)
    return 
  }
}