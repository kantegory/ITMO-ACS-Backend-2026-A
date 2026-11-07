import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../common/env';
import { createServiceApp } from '../../common/createApp';
import {
  asyncHandler, authenticate, validate, internalOnly,
  hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken,
} from '../../common/http';
import { HttpError } from '../../common/httpError';
import { UserRole } from '../../common/enums';
import { callService } from '../../common/internalClient';
import { User } from './entities/User';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false, entities: [User],
});

const repo = (): Repository<User> => dataSource.getRepository(User);
const present = (u: User) => ({ id: u.id, email: u.email, role: u.role, created_at: u.createdAt, updated_at: u.updatedAt });
const tokens = (u: User) => ({
  access_token: signAccessToken({ sub: u.id, role: u.role }),
  refresh_token: signRefreshToken({ sub: u.id, role: u.role }),
  token_type: 'Bearer', expires_in: env.jwt.accessExpiresIn, user: present(u),
});

const registerSchema = z.object({
  email: z.string().email('Некорректный формат email'),
  password: z.string().min(8, 'Минимальная длина — 8 символов'),
  role: z.enum([UserRole.SEEKER, UserRole.EMPLOYER]),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
}).refine((d) => d.role !== UserRole.SEEKER || (d.first_name && d.last_name), {
  message: 'Для роли seeker обязательны first_name и last_name', path: ['first_name'],
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const refreshSchema = z.object({ refresh_token: z.string().min(1) });

const routes = Router();

routes.post('/auth/register', validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role, first_name, last_name } = req.body;
  if (await repo().findOne({ where: { email } })) throw HttpError.conflict('Email уже зарегистрирован');
  const user = repo().create({ email, passwordHash: await hashPassword(password), role });
  await repo().save(user);

  // создаём профиль в соответствующем сервисе (синхронный межсервисный вызов)
  try {
    if (role === UserRole.SEEKER) {
      await callService('seeker', '/internal/seekers', {
        method: 'POST', body: { user_id: user.id, first_name, last_name },
      });
    } else {
      await callService('employer', '/internal/employers', {
        method: 'POST', body: { user_id: user.id },
      });
    }
  } catch (e) {
    // если профиль не создался — откатываем пользователя
    await repo().delete({ id: user.id });
    throw e;
  }

  res.status(201).json(tokens(user));
}));

routes.post('/auth/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const user = await repo().findOne({ where: { email: req.body.email } });
  if (!user || !(await verifyPassword(req.body.password, user.passwordHash))) {
    throw HttpError.unauthorized('Неверный email или пароль');
  }
  res.json(tokens(user));
}));

routes.post('/auth/refresh', validate(refreshSchema), asyncHandler(async (req: Request, res: Response) => {
  let payload;
  try { payload = verifyRefreshToken(req.body.refresh_token); }
  catch { throw HttpError.unauthorized('refresh-токен недействителен или истёк'); }
  const user = await repo().findOne({ where: { id: payload.sub } });
  if (!user) throw HttpError.unauthorized('Пользователь не найден');
  res.json(tokens(user));
}));

routes.get('/users/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await repo().findOne({ where: { id: req.user!.id } });
  if (!user) throw HttpError.notFound('Пользователь не найден');
  res.json(present(user));
}));

routes.delete('/users/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await repo().delete({ id: req.user!.id });
  res.status(204).send();
}));

// ---------- internal ----------
const internal = Router();
internal.use(internalOnly);

internal.get('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = await repo().findOne({ where: { id: Number(req.params.id) } });
  if (!user) throw HttpError.notFound();
  res.json({ id: user.id, email: user.email, role: user.role });
}));

internal.post('/users/verify-token', asyncHandler(async (req: Request, res: Response) => {
  try {
    const p = verifyAccessToken(req.body.token);
    res.json({ user_id: p.sub, role: p.role });
  } catch { throw HttpError.unauthorized('Токен недействителен'); }
}));

export const app = createServiceApp('auth', routes, internal);
