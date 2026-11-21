import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { signToken } from '../../../shared/src/jwt';

function toSafeUser(userRaw: Record<string, unknown>) {
  return { id: userRaw.id, name: userRaw.name, email: userRaw.email, role: userRaw.role };
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body as Record<string, string>;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash });
    const plain = user.toJSON() as Record<string, unknown>;

    return res.status(201).json({
      token: signToken(plain as { id: number; email: string }),
      user: toSafeUser(plain)
    });
  } catch {
    return res.status(500).json({ error: 'internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as Record<string, string>;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const plain = user.toJSON() as { password_hash: string; id: number; email: string };
    const matches = await bcrypt.compare(password, plain.password_hash);
    if (!matches) return res.status(401).json({ error: 'invalid credentials' });

    return res.json({
      token: signToken(plain),
      user: toSafeUser(user.toJSON() as Record<string, unknown>)
    });
  } catch {
    return res.status(500).json({ error: 'internal server error' });
  }
}
