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


export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
):void  => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ResponseHandler.unauthorized(res, 'Authorization header missing or malformed');
      return 
    }

    const token = authHeader.split(' ')[1];

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