import type { Request, Response } from 'express';
import User from '../models/User';
import { verifyToken } from '../../../shared/src/jwt';

export async function getUserById(req: Request, res: Response) {
  const user = await User.findByPk(req.params.id, { attributes: ['id', 'name', 'email', 'role'] });
  if (!user) return res.status(404).json({ error: 'user not found' });
  return res.json(user);
}

export async function verifyAuthToken(req: Request, res: Response) {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id, { attributes: ['id', 'name', 'email', 'role'] });
    if (!user) return res.status(404).json({ valid: false, error: 'user not found' });
    return res.json({ valid: true, user: user.toJSON() });
  } catch {
    return res.status(401).json({ valid: false, error: 'invalid or expired token' });
  }
}
