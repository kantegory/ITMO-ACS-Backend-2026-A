import type { NextFunction, Request, Response } from 'express';
import { verifyBearerToken } from '../clients/authClient';

export default async function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing or invalid auth token' });
  }

  const user = await verifyBearerToken(token);
  if (!user) return res.status(401).json({ error: 'invalid or expired token' });
  req.user = user;
  return next();
}
