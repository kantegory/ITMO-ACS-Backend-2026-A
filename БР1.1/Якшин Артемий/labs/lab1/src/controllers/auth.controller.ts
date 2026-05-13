import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { signToken } from '../utils/jwt';
import { BadRequest, Conflict, Unauthorized } from '../utils/errors';
import { serializeUser } from '../utils/serializers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+7\d{10}$/;

export const register = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body ?? {};

  const details: { field: string; message: string }[] = [];
  if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100)
    details.push({ field: 'name', message: 'Must be 2-100 characters' });
  if (!email || !EMAIL_RE.test(email))
    details.push({ field: 'email', message: 'Must be a valid email address' });
  if (phone && !PHONE_RE.test(phone))
    details.push({ field: 'phone', message: 'Must match +7XXXXXXXXXX' });
  if (!password || password.length < 8 || password.length > 64)
    details.push({ field: 'password', message: 'Must be 8-64 characters' });
  if (details.length) throw BadRequest('Validation failed', details);

  const repo = AppDataSource.getRepository(User);
  if (await repo.findOne({ where: { email } })) {
    throw Conflict('User with this email already exists');
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = repo.create({ name, email, phone: phone ?? null, password_hash });
  await repo.save(user);

  const token = signToken({ user_id: user.user_id, email: user.email });
  res.status(201).json({ token, user: serializeUser(user) });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    throw BadRequest('email and password are required');
  }
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { email } });
  if (!user) throw Unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw Unauthorized('Invalid email or password');

  const token = signToken({ user_id: user.user_id, email: user.email });
  res.json({ token, user: serializeUser(user) });
};
