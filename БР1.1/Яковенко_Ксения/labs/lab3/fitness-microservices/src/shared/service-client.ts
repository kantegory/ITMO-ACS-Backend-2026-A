import { SERVICE_TOKEN } from './env';
import { HttpError } from './http';

interface ServiceRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function serviceRequest<T>(
  baseUrl: string,
  path: string,
  options: ServiceRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
      headers: {
        'content-type': 'application/json',
        'x-service-token': SERVICE_TOKEN,
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let payload: unknown = undefined;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      const objectPayload = payload as { message?: string; error?: string } | undefined;
      throw new HttpError(
        response.status,
        objectPayload?.message ?? `Dependent service returned ${response.status}`,
        objectPayload?.error ?? 'DEPENDENT_SERVICE_ERROR',
        payload,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    const message = error instanceof Error ? error.message : 'Dependent service is unavailable';
    throw new HttpError(503, message, 'SERVICE_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
}
