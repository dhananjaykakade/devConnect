import { Request, Response,RequestHandler } from 'express'
import prisma from '../../helper/prisma.helper'
import ResponseHandler from '../../utils/ApiResponse'
import { createPostSchema,updatePostSchema,addCommentSchema  } from './post.validation'
import { AuthenticatedRequest } from '../../middlewares/auth.middleware'

export const createPost:RequestHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createPostSchema.safeParse(req.body)
    if (!parsed.success) {
        ResponseHandler.validationError(res, 'Invalid input', parsed.error.format())
      return 
    }

    const { content, techTags, media } = parsed.data

    const newPost = await prisma.post.create({
      data: {
        content,
        techTags,
        media: media || "",
        authorId: req.user!.id,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
      },
    })

    ResponseHandler.success(res, 201, 'Post created', newPost)
    return 
  } catch (error) {
      ResponseHandler.handleError(error, res)
    return 
  }
}

export const getAllPosts:RequestHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit
    const username = req.query.username as string

    const techTag = req.query.techTag as string
    const search = req.query.search as string

    const whereClause: any = {}

    if (techTag) {
      whereClause.techTags = { has: techTag }
    }

    if (username) {
      whereClause.author = { username: { equals: username, mode: 'insensitive' } }
    }

    if (search) {
      whereClause.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { author: { username: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        comments: true,
      },
    })

    const total = await prisma.post.count({ where: whereClause })

    ResponseHandler.success(res, 200, 'Posts fetched successfully', {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    ResponseHandler.handleError(error, res)
  }
}


export const getPostById:RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        comments: {
          include: {
            author: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    })

    if (!post) {
      ResponseHandler.notFound(res, 'Post not found')
      return 
    }

    ResponseHandler.success(res, 200, 'Post fetched successfully', post)
  } catch (error) {
    ResponseHandler.handleError(error, res)
  }
}


export const updatePost: RequestHandler = async (req:AuthenticatedRequest, res:Response) => {
  try {
    const userId = req.user?.id
    const postId = req.params.id

    const parsed = updatePostSchema.safeParse(req.body)
    if (!parsed.success) {
      ResponseHandler.validationError(res, 'Invalid input', parsed.error.format())
      return 
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      ResponseHandler.notFound(res, 'Post not found')
      return 
    }

    if (post.authorId !== userId) {
      ResponseHandler.forbidden(res, 'You are not allowed to update this post')
      return 
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        content: parsed.data.content,
        techTags: parsed.data.techTags,
      },
    })

    ResponseHandler.success(res, 200, 'Post updated successfully', updated)
    return 
  } catch (error) {
    ResponseHandler.handleError(error, res)
    return 
  }
}

export const deletePost: RequestHandler = async (req:AuthenticatedRequest, res:Response) => {
  try {
    const userId = req.user?.id
    const postId = req.params.id

    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      ResponseHandler.notFound(res, 'Post not found')
      return 
    }

    if (post.authorId !== userId) {
      ResponseHandler.forbidden(res, 'You are not allowed to delete this post')
      return 
    }

    await prisma.post.delete({
      where: { id: postId },
    })

    ResponseHandler.success(res, 200, 'Post deleted successfully')
    return
  } catch (error) {
    ResponseHandler.handleError(error, res)
    return 
  }
}


export const toggleLikePost: RequestHandler = async (req:AuthenticatedRequest, res:Response) => {
  try {
    const userId = req.user?.id
    const postId = req.params.id

    const post = await prisma.post.findUnique({ where: { id: postId } })

    if (!post) {
      ResponseHandler.notFound(res, 'Post not found')
      return
    }

if (!userId) {
  ResponseHandler.unauthorized(res, 'User not authenticated')
      return 
    }
        const hasLiked = post.likes.includes(userId)

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likes: hasLiked
          ? post.likes.filter((id) => id !== userId)
          : [...post.likes, userId],
      },
    })

    const message = hasLiked ? 'Post unliked' : 'Post liked'

    ResponseHandler.success(res, 200, message, {
      likesCount: updatedPost.likes.length,
    })
    return 
  } catch (error) {
    ResponseHandler.handleError(error, res)
    return 
  }
}


export const addComment: RequestHandler = async (req:AuthenticatedRequest, res:Response) => {
  try {
    const userId = req.user?.id
    const postId = req.params.id

    const parsed = addCommentSchema.safeParse(req.body)
    if (!parsed.success) {
      ResponseHandler.validationError(res, 'Invalid input', parsed.error.format())
      return 
    }

    const { content } = parsed.data

    const postExists = await prisma.post.findUnique({ where: { id: postId } })
    if (!postExists) {
      ResponseHandler.notFound(res, 'Post not found')
      return 
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId!,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    })

    ResponseHandler.success(res, 201, 'Comment added successfully', newComment)
    return
  } catch (error) {
    ResponseHandler.handleError(error, res)
    return 
  }
}

export const deleteComment: RequestHandler = async (req:AuthenticatedRequest, res:Response) => {
  try {
    const commentId = req.params.id
    const userId = req.user?.id

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    })

    if (!comment) {
      ResponseHandler.notFound(res, 'Comment not found')
      return 
    }

    // Check if the requester is comment author or post owner
    const isOwner = comment.authorId === userId || comment.post.authorId === userId

    if (!isOwner) {
      ResponseHandler.forbidden(res, 'You do not have permission to delete this comment')
      return 
    }

    await prisma.comment.delete({ where: { id: commentId } })

    ResponseHandler.success(res, 200, 'Comment deleted successfully')
    return 
  } catch (error) {
    ResponseHandler.handleError(error, res)
    return 
  }
}

export const getCommentsByPost: RequestHandler = async (req:Request, res:Response) => {
  try {
    const postId = req.params.id

    // Optional: check if post exists
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) {
      ResponseHandler.notFound(res, 'Post not found')
      return 
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    ResponseHandler.success(res, 200, 'Comments fetched successfully', comments)
    return 
  } catch (error) {
    ResponseHandler.handleError(error, res)
    return
  }
}