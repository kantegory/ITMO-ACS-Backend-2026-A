import { HttpError, serviceUnavailable } from "../utils/errors";
import { config } from "../config";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface InternalCallOptions {
  method?: Method;
  body?: unknown;
  // Если передан, перенаправляет ошибки HTTP в HttpError того же статуса.
  passthroughErrors?: boolean;
}

// Тонкий HTTP-клиент для межсервисных вызовов. Использует внутренний токен и
// глобальный таймаут, превращает сетевые ошибки и 5xx источника в 503,
// чтобы вызывающий код не падал с непонятной ошибкой.
export const internalCall = async <T>(url: string, opts: InternalCallOptions = {}): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Token": config.internalToken,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw serviceUnavailable(`Не удалось связаться с сервисом: ${(e as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  // Превращаем 5xx из downstream в 503 для нас.
  if (response.status >= 500) {
    throw serviceUnavailable("Downstream сервис вернул ошибку");
  }

  const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  throw new HttpError(
    response.status,
    body.error ?? "downstream_error",
    body.message ?? "Ошибка downstream сервиса"
  );
};
