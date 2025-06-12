import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  name: z.string().min(1).max(50).optional(),
  password: z.string().min(6),
})


export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(200).optional(),
  avatar: z.string().url().optional(),
  techStack: z.array(z.string()).max(5).optional(),
})