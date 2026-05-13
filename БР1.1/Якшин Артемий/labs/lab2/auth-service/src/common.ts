// Общие утилиты микросервиса: ошибки, обработчики, JWT, межсервисные вызовы.
import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export const BadRequest = (m: string, d?: unknown) => new HttpError(400, 'Bad Request', m, d);
export const Unauthorized = (m = 'Missing or invalid authorization token') => new HttpError(401, 'Unauthorized', m);
export const Forbidden = (m = "You don't have permission to perform this action") => new HttpError(403, 'Forbidden', m);
export const NotFound = (m = 'Resource not found') => new HttpError(404, 'Not Found', m);
export const Conflict = (m: string) => new HttpError(409, 'Conflict', m);
export const ServiceUnavailable = (m: string) => new HttpError(503, 'Service Unavailable', m);

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
};

// ── JWT (общий секрет на все сервисы) ──────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
export interface JwtPayload { user_id: number; email: string }
export const signToken = (p: JwtPayload): string =>
  jwt.sign(p, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] });
export const verifyToken = (t: string): JwtPayload => jwt.verify(t, JWT_SECRET) as JwtPayload;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: JwtPayload } }
}
export const authMiddleware: RequestHandler = (req, _res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return next(Unauthorized());
  try { req.user = verifyToken(h.slice(7).trim()); next(); } catch { next(Unauthorized()); }
};

// ── Сервисная аутентификация межсервисных вызовов ──────────────────
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || 'internal-secret';
export const internalKeyMiddleware: RequestHandler = (req, _res, next) => {
  if (req.headers['x-internal-key'] !== INTERNAL_KEY) {
    return next(new HttpError(401, 'Unauthorized', 'Invalid or missing X-Internal-Key'));
  }
  next();
};

// ── Межсервисный HTTP-клиент ───────────────────────────────────────
const TIMEOUT_MS = Number(process.env.SVC_TIMEOUT_MS || 4000);
async function call<T>(method: 'GET' | 'POST', url: string, body?: unknown): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: { 'x-internal-key': INTERNAL_KEY, ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw ServiceUnavailable(`dependency unavailable: ${url}`);
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404) throw NotFound('Resource not found');
  if (!res.ok) throw new HttpError(502, 'Bad Gateway', `dependency error ${res.status}: ${url}`);
  return (await res.json()) as T;
}
/** Строгий вызов: 404 → NotFound, недоступность → 503. */
export const svcGet = <T>(url: string) => call<T>('GET', url);
export const svcPost = <T>(url: string, body: unknown) => call<T>('POST', url, body);
/** Мягкое обогащение: при любой ошибке вернуть fallback. */
export async function svcGetSoft<T>(url: string, fallback: T): Promise<T> {
  try { return await call<T>('GET', url); } catch { return fallback; }
}
export async function svcPostSoft<T>(url: string, body: unknown, fallback: T): Promise<T> {
  try { return await call<T>('POST', url, body); } catch { return fallback; }
}
