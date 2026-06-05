import type { Request, Response } from 'express';

export async function me(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'missing auth user' });
  return res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role });
}
