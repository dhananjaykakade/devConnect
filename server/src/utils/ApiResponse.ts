import { refreshToken } from './../module/auth/auth.controller';
import { Response } from 'express'
import { messages } from '../constants/messages'

interface ErrorPayload {
  [key: string]: any
}

interface DataPayload {
  [key: string]: any
}

class ResponseHandler {
  static success(
    res: Response,
    statusCode = 200,
    message = messages.success.DEFAULT,
    data: DataPayload = {}
  ) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    })
  }

  static error(
    res: Response,
    statusCode = 500,
    message = messages.error.DEFAULT,
    errors: ErrorPayload = {}
  ) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    })
  }

  static validationError(
    res: Response,
    message = messages.error.VALIDATION,
    errors: ErrorPayload = {}
  ) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message,
      errors,
    })
  }

  static unauthorized(
    res: Response,
    message = messages.error.UNAUTHORIZED
  ) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message,
    })
  }

  static forbidden(
    res: Response,
    message = messages.error.FORBIDDEN
  ) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message,
    })
  }

  static notFound(
    res: Response,
    message = messages.error.NOT_FOUND
  ) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message,
    })
  }

  static badRequest(
    res: Response,
    message = messages.error.BAD_REQUEST,
    errors: ErrorPayload = {}
  ) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message,
      errors,
    })
  }

  static conflict(
    res: Response,
    message = messages.error.CONFLICT
  ) {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message,
    })
  }

  static tooManyRequests(
    res: Response,
    message = messages.error.TOO_MANY_REQUESTS
  ) {
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message,
    })
  }

  static serviceUnavailable(
    res: Response,
    message = messages.error.SERVICE_UNAVAILABLE
  ) {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      message,
    })
  }

  static handleError(
    err: any,
    res: Response
  ) {
    const statusCode = err.statusCode || 500
    const message = err.message || messages.error.DEFAULT
    const errors = err.errors || {}

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    })
  }

  // create new method for sending access token in cookie with proper response with user object 
  static sendAccessToken(
    res: Response,
    user: any,
    accessToken: string,
    refreshToken: string,
    statusCode = 200,
    message = messages.success.LOGGED_IN
  ) {
  // Set cookies first
  res.cookie('accessToken', accessToken, { /* cookie options */ });
  res.cookie('refreshToken', refreshToken, { /* cookie options */ });
  
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data: { 
      user
      
       
    }
  });
}
}

export default ResponseHandler
