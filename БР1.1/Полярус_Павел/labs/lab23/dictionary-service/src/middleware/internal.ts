import { Request, Response, NextFunction } from 'express';

export const requireInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ statusCode: 403, message: 'Forbidden' });
    return;
  }
  next();
};
