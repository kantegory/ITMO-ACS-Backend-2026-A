import type { NextFunction, Request, Response } from 'express';
import { SERVICE_KEY } from './config';

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-service-key'];
  if (key !== SERVICE_KEY) {
    return res.status(403).json({ error: 'invalid service key' });
  }
  return next();
}
