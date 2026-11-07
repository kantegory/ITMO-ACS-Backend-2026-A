import { NextFunction, Request, Response } from 'express';
import { forbidden, unauthorized } from '../utils/errors';
import { verifyToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const extract = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

/** Требует валидный access-токен. */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extract(req);
  if (!token) {
    next(unauthorized());
    return;
  }
  try {
    const payload = verifyToken(token, 'access');
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
};

/** Заполняет req.user, если токен передан, но не требует его. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extract(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyToken(token, 'access');
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
  } catch {
    /* анонимный доступ — игнорируем некорректный токен */
  }
  next();
};

/** Требует роль администратора (после authenticate). */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    next(forbidden('Операция доступна только администратору'));
    return;
  }
  next();
};
