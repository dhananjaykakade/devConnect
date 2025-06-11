import { z } from 'zod'

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  techTags: z.array(z.string()).min(1, 'At least one tag required'),
  media: z.string().url().optional(),   // optional image / video URL
})

export const updatePostSchema = z.object({
  content: z.string().min(1).max(1000),
  techTags: z.array(z.string()).optional(),
})

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})