import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { errorResponse } from '../common/dto';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse(401, 'No token provided'));
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json(errorResponse(401, 'Invalid or expired token'));
  }

  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  next();
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse(401, 'Unauthorized'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
}