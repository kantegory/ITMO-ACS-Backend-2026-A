import { NextFunction, Request, RequestHandler, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ZodSchema } from 'zod';
import { AppError, badRequest, forbidden, unauthorized } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

export interface AuthUser { id: string; username: string; role: string; }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: AuthUser; }
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };

const extract = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

export const makeAuth = (secret: string) => ({
  authenticate: (req: Request, _res: Response, next: NextFunction): void => {
    const token = extract(req);
    if (!token) return next(unauthorized());
    try {
      const payload = verifyToken(token, secret, 'access');
      req.user = { id: payload.sub, username: payload.username, role: payload.role };
      next();
    } catch (error) {
      next(error);
    }
  },
  optionalAuth: (req: Request, _res: Response, next: NextFunction): void => {
    const token = extract(req);
    if (token) {
      try {
        const payload = verifyToken(token, secret, 'access');
        req.user = { id: payload.sub, username: payload.username, role: payload.role };
      } catch { /* анонимный доступ */ }
    }
    next();
  },
  requireAdmin: (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'admin') return next(forbidden('Операция доступна только администратору'));
    next();
  },
});

/** Проверка общего секрета внутренней сети для эндпоинтов /internal/*. */
export const internalOnly = (token: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (req.header('X-Internal-Token') !== token) {
      return next(unauthorized('Внутренний вызов не авторизован'));
    }
    next();
  };

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(badRequest('Проверьте корректность переданных данных', details));
    }
    if (source === 'query') {
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[source] = result.data as never;
    }
    next();
  };

export const validatedQuery = <T>(req: Request): T =>
  ((req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query) as T;

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Маршрут ${req.method} ${req.originalUrl} не найден` },
  });
};

export const makeErrorHandler = (service: string) =>
  (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.status).json({
        error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
      });
      return;
    }
    if (err instanceof QueryFailedError) {
      const code = (err as QueryFailedError & { code?: string }).code;
      if (code === '23505') {
        res.status(409).json({ error: { code: 'CONFLICT', message: 'Нарушено ограничение уникальности' } });
        return;
      }
      if (code === '23503') {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Связанная сущность не найдена' } });
        return;
      }
    }
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Тело запроса не является корректным JSON' } });
      return;
    }
    // eslint-disable-next-line no-console
    console.error(`[${service}][unhandled]`, err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Внутренняя ошибка сервера',
        debug: err instanceof Error ? err.message : String(err),
      },
    });
  };
