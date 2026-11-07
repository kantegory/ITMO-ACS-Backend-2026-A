import { Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ZodSchema, ZodError } from 'zod';
import { QueryFailedError } from 'typeorm';
import { env } from './env';
import { HttpError } from './httpError';
import { UserRole } from './enums';

// ---------- async wrapper ----------
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };

// ---------- password ----------
export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

// ---------- jwt ----------
export interface TokenPayload { sub: number; role: UserRole }
export const signAccessToken = (p: TokenPayload): string =>
  jwt.sign(p, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });
export const signRefreshToken = (p: TokenPayload): string =>
  jwt.sign(p, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });
export const verifyAccessToken = (t: string): TokenPayload =>
  jwt.verify(t, env.jwt.accessSecret) as unknown as TokenPayload;
export const verifyRefreshToken = (t: string): TokenPayload =>
  jwt.verify(t, env.jwt.refreshSecret) as unknown as TokenPayload;

// ---------- auth middleware (валидация JWT локально, секрет общий) ----------
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: number; role: UserRole } }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw HttpError.unauthorized();
  try {
    const p = verifyAccessToken(header.slice(7));
    req.user = { id: p.sub, role: p.role };
    next();
  } catch { throw HttpError.unauthorized('Недействительный или истёкший токен'); }
};

export const requireRole = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw HttpError.unauthorized();
    if (!roles.includes(req.user.role)) throw HttpError.forbidden('Операция недоступна для вашей роли');
    next();
  };

// ---------- проверка служебного токена для /internal ----------
export const internalOnly = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.headers['x-internal-token'] !== env.internalToken) {
    throw HttpError.unauthorized('Недействительный служебный токен');
  }
  next();
};

// ---------- валидация zod ----------
type Part = 'body' | 'query' | 'params';
export const validate =
  (schema: ZodSchema, part: Part = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      (req as unknown as Record<Part, unknown>)[part] = parsed;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const errors = e.errors.map((it) => ({ field: it.path.join('.') || '(root)', message: it.message }));
        throw HttpError.validation('Проверьте корректность переданных полей', errors);
      }
      throw e;
    }
  };

// ---------- обработка ошибок ----------
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ code: err.code, message: err.message, ...(err.details ? { errors: err.details } : {}) });
    return;
  }
  if (err instanceof QueryFailedError && (err as unknown as { code?: string }).code === '23505') {
    res.status(409).json({ code: 'CONFLICT', message: 'Запись с такими данными уже существует' });
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Эндпоинт не найден' });
};

// ---------- пагинация ----------
export const getPageParams = (query: { page?: unknown; limit?: unknown }) => {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  return { page, limit, skip: (page - 1) * limit, take: limit };
};
export const buildMeta = (page: number, limit: number, total: number) => ({
  page, limit, total, total_pages: Math.ceil(total / limit) || 0,
});
