import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';
import { UserRole } from '../entities/enums';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number; role: UserRole };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw HttpError.unauthorized();
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw HttpError.unauthorized('Недействительный или истёкший токен');
  }
};

export const requireRole = (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw HttpError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw HttpError.forbidden('Операция недоступна для вашей роли');
    }
    next();
  };
