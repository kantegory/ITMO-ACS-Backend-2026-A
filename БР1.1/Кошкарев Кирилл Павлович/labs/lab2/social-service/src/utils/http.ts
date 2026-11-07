import { unavailable } from './errors';

/** Минимальный клиент для синхронных межсервисных вызовов с таймаутом. */
export const internalGet = async <T>(
  url: string,
  token: string,
  timeoutMs = 3000,
): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'X-Internal-Token': token },
      signal: controller.signal,
    });
    if (response.status === 404) return null;
    if (!response.ok) throw unavailable(`Внутренний вызов ${url} вернул ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw unavailable(`Внутренний вызов ${url} не уложился в ${timeoutMs} мс`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
