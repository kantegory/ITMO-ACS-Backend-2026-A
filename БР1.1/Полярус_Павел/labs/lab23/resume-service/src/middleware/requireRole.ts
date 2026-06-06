import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ statusCode: 401, message: 'Unauthorized' }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ statusCode: 403, message: 'Forbidden' }); return; }
    next();
  };
};
