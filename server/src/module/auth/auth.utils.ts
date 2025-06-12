import jwt from 'jsonwebtoken'
import { config } from '../../config/config.service';
import { PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

type JwtPayload = { id: string; role: string ; name: string; username: string }

export const createTokens = async (payload: JwtPayload) => {
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' })
  const refreshToken = jwt.sign(payload, config.refreshSecret, { expiresIn: '7d' })

  // Persist refresh token (hashed storage is even safer; keeping simple here)
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.id,
      expiresAt: addDays(new Date(), 7),
    },
  })

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.jwtSecret) as JwtPayload

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.refreshSecret) as JwtPayload
