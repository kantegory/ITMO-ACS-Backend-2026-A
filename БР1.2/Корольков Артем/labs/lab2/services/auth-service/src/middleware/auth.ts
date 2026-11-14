import type { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import { verifyToken } from '../../../shared/src/jwt';

export default async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'missing or invalid auth token' });
    }

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: 'user not found' });
    req.user = user as Request['user'];
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}
