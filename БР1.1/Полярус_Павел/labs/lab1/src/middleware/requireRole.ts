import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden' });
      return;
    }
    next();
  };
};
