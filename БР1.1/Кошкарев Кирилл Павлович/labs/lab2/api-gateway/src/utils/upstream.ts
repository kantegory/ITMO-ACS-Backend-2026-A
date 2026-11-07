import { Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from './errors';

export interface UpstreamResult<T = any> {
  status: number;
  body: T;
}

const withTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs = env.upstreamTimeoutMs,
): Promise<globalThis.Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new AppError(504, 'UPSTREAM_TIMEOUT', `Сервис ${new URL(url).host} не ответил вовремя`);
    }
    throw new AppError(503, 'SERVICE_UNAVAILABLE', `Сервис ${new URL(url).host} недоступен`);
  } finally {
    clearTimeout(timer);
  }
};

/** Прозрачное проксирование пользовательского запроса в сервис-владелец. */
export const proxy = async (req: Request, res: Response, baseUrl: string): Promise<void> => {
  const target = `${baseUrl}/api/v1${req.originalUrl.replace(/^\/api\/v1/, '')}`;
  const response = await withTimeout(target, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
    },
    ...(['GET', 'HEAD', 'DELETE'].includes(req.method) || !Object.keys(req.body ?? {}).length
      ? {}
      : { body: JSON.stringify(req.body) }),
  });
  const text = await response.text();
  res.status(response.status);
  if (!text) { res.send(); return; }
  res.type(response.headers.get('content-type') ?? 'application/json').send(text);
};

/** Вызов внутреннего эндпоинта другого сервиса. */
export const internalGet = async <T>(url: string): Promise<T> => {
  const response = await withTimeout(url, { headers: { 'X-Internal-Token': env.internalToken } });
  const body = (await response.json().catch(() => null)) as T;
  if (!response.ok) {
    const error = (body as any)?.error;
    throw new AppError(response.status, error?.code ?? 'UPSTREAM_ERROR', error?.message ?? 'Ошибка вызова сервиса');
  }
  return body;
};

/**
 * «Мягкий» вызов: сбой второстепенного сервиса не должен ронять весь ответ.
 * Возвращает fallback и пишет предупреждение в лог.
 */
export const internalGetSoft = async <T>(url: string, fallback: T): Promise<T> => {
  try {
    return await internalGet<T>(url);
  } catch (error) {
    console.warn(`[gateway] деградация: ${url} → ${(error as Error).message}`);
    return fallback;
  }
};

export const userRequest = async <T>(req: Request, url: string, init: RequestInit = {}): Promise<UpstreamResult<T>> => {
  const response = await withTimeout(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => null)) as T;
  return { status: response.status, body };
};
