import { env } from './env';
import { HttpError } from './httpError';

type ServiceName = keyof typeof env.services;

interface CallOptions {
  method?: string;
  body?: unknown;
  // вернуть null вместо ошибки при 404
  nullOn404?: boolean;
}

/**
 * Выполняет межсервисный вызов к внутреннему API (/internal) другого сервиса.
 * Добавляет служебный заголовок X-Internal-Token.
 */
export async function callService<T = unknown>(
  service: ServiceName,
  path: string,
  options: CallOptions = {},
): Promise<T | null> {
  const url = `${env.services[service]}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': env.internalToken,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw HttpError.unavailable(`Сервис ${service} недоступен`);
  }

  if (res.status === 404) {
    if (options.nullOn404) return null;
    throw HttpError.notFound();
  }
  if (!res.ok) {
    throw new HttpError(res.status, 'UPSTREAM_ERROR', `Ошибка вызова сервиса ${service}`);
  }
  if (res.status === 204) return null;
  return (await res.json()) as T;
}
