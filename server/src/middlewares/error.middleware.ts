import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'
import logger from '../utils/logger'
import ResponseHandler from '../utils/ApiResponse'

export const NotFoundHandler = (req: Request, res: Response) => {
    ResponseHandler.notFound(
        res,
        `Not Found - ${req.originalUrl}`,
       )
}

export const ErrorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500

  logger.error({
    message: err.message,
    stack: err.stack,
    errors: err.errors || [],
    path: req.originalUrl,
    method: req.method
  })

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}
