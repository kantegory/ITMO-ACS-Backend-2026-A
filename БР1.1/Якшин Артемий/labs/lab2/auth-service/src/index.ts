import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { In } from 'typeorm';
import { AppDataSource } from './data-source';
import { User } from './entities/User';
import {
  asyncHandler, errorHandler, authMiddleware, internalKeyMiddleware,
  signToken, BadRequest, Conflict, Unauthorized, NotFound,
} from './common';

const PORT = Number(process.env.PORT || 8081);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+7\d{10}$/;

const publicUser = (u: User) => ({ user_id: u.user_id, name: u.name, email: u.email, phone: u.phone, created_at: u.created_at });
const summaryUser = (u: User) => ({ user_id: u.user_id, name: u.name, email: u.email, phone: u.phone });

async function seed() {
  const repo = AppDataSource.getRepository(User);
  if (await repo.count()) return;
  await repo.save([
    repo.create({ name: 'Иван Иванов', email: 'ivan@example.com', phone: '+79001234567', password_hash: await bcrypt.hash('securepass123', 10) }),
    repo.create({ name: 'Мария Петрова', email: 'maria@example.com', phone: '+79007654321', password_hash: await bcrypt.hash('mariapass456', 10) }),
  ]);
  console.log('[auth-service] seeded 2 users');
}

async function main() {
  await AppDataSource.initialize();
  await seed();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

  // ── публичный API (через gateway) ──────────────────────────────
  const api = express.Router();

  api.post('/auth/register', asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body || {};
    const details: { field: string; message: string }[] = [];
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100) details.push({ field: 'name', message: 'Must be 2-100 characters' });
    if (!email || !EMAIL_RE.test(email)) details.push({ field: 'email', message: 'Must be a valid email address' });
    if (phone && !PHONE_RE.test(phone)) details.push({ field: 'phone', message: 'Must match +7XXXXXXXXXX' });
    if (!password || password.length < 8 || password.length > 64) details.push({ field: 'password', message: 'Must be 8-64 characters' });
    if (details.length) throw BadRequest('Validation failed', details);
    const repo = AppDataSource.getRepository(User);
    if (await repo.findOne({ where: { email } })) throw Conflict('User with this email already exists');
    const user = repo.create({ name, email, phone: phone ?? null, password_hash: await bcrypt.hash(password, 10) });
    await repo.save(user);
    res.status(201).json({ token: signToken({ user_id: user.user_id, email: user.email }), user: publicUser(user) });
  }));

  api.post('/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw BadRequest('email and password are required');
    const user = await AppDataSource.getRepository(User).findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) throw Unauthorized('Invalid email or password');
    res.json({ token: signToken({ user_id: user.user_id, email: user.email }), user: publicUser(user) });
  }));

  api.get('/users/me', authMiddleware, asyncHandler(async (req, res) => {
    const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user!.user_id } });
    if (!user) throw NotFound('User not found');
    res.json(publicUser(user));
  }));

  api.put('/users/me', authMiddleware, asyncHandler(async (req, res) => {
    const { name, phone, password } = req.body || {};
    const details: { field: string; message: string }[] = [];
    if (name !== undefined && (typeof name !== 'string' || name.length < 2 || name.length > 100)) details.push({ field: 'name', message: 'Must be 2-100 characters' });
    if (phone !== undefined && phone !== null && !PHONE_RE.test(phone)) details.push({ field: 'phone', message: 'Must match +7XXXXXXXXXX' });
    if (password !== undefined && (password.length < 8 || password.length > 64)) details.push({ field: 'password', message: 'Must be 8-64 characters' });
    if (details.length) throw BadRequest('Validation failed', details);
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { user_id: req.user!.user_id } });
    if (!user) throw NotFound('User not found');
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (password !== undefined) user.password_hash = await bcrypt.hash(password, 10);
    await repo.save(user);
    res.json(publicUser(user));
  }));

  app.use('/api/v1', api);

  // ── внутренний API (service-to-service) ────────────────────────
  const internal = express.Router();
  internal.use(internalKeyMiddleware);
  internal.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: Number(req.params.id) } });
    if (!user) throw NotFound('User not found');
    res.json(summaryUser(user));
  }));
  internal.post('/users/batch', asyncHandler(async (req, res) => {
    const ids: number[] = Array.isArray(req.body?.user_ids) ? req.body.user_ids.map(Number) : [];
    if (!ids.length) return res.json([]);
    const users = await AppDataSource.getRepository(User).findBy({ user_id: In(ids) });
    res.json(users.map(summaryUser));
  }));
  app.use('/internal', internal);

  app.use((_req, _res, next) => next(NotFound('Endpoint not found')));
  app.use(errorHandler);
  app.listen(PORT, () => console.log(`[auth-service] listening on :${PORT}`));
}

main().catch((e) => { console.error('[auth-service] fatal', e); process.exit(1); });
