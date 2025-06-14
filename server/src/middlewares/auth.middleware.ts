import { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.service';
import ResponseHandler from '../utils/ApiResponse';

interface DecodedToken {
  id: string;
  role: string;
  name: string;
  username: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
    username: string;
  };
}
export const getTokenFromRequest = (req: Request): string | null => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

export const getRefreshTokenFromRequest = (req: Request): string | null => {
  if (req.cookies?.refreshToken) {
    return req.cookies.refreshToken;
  }

  const refreshHeader = req.headers['x-refresh-token'];
  if (typeof refreshHeader === 'string' && refreshHeader.trim() !== '') {
    return refreshHeader;
  }

  return null;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
):void  => {
  try {

const token = getTokenFromRequest(req);

    if (!token) {
      ResponseHandler.unauthorized(res, 'Access token missing');
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as DecodedToken;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name, 
      username: decoded.username 
    };

    next();
  } catch (error) {
      ResponseHandler.unauthorized(res, 'Invalid or expired token');
    return 
  }
};