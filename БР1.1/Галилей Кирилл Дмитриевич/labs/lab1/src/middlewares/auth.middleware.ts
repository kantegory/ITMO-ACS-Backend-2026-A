import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SETTINGS } from '../config/settings';
import { UserRole } from '../models/user.entity';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Access token is missing or invalid'
    });
    return;
  }

  jwt.verify(token, SETTINGS.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token has expired or is invalid'
      });
      return;
    }
    req.user = decoded as AuthRequest['user'];
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      return;
    }
    next();
  };
};
