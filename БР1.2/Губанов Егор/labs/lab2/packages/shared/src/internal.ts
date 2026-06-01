import { AppError, E } from "./errors";

export function internalKey(): string {
  return process.env.INTERNAL_KEY || "dev-internal-key";
}

export function internalHeaders(): Record<string, string> {
  return {
    "X-Internal-Key": internalKey(),
    "Content-Type": "application/json",
  };
}

export function requireInternalKey(
  headers: Record<string, string | string[] | undefined>
) {
  const got = headers["x-internal-key"];
  const val = Array.isArray(got) ? got[0] : got;
  if (val !== internalKey()) throw E.unauthorized();
}

export async function internalJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...internalHeaders(), ...(init?.headers as object) },
  });
  const text = await res.text();
  let body: { code?: number; message?: string } = {};
  if (text) {
    try {
      body = JSON.parse(text) as { code?: number; message?: string };
    } catch {
      throw new AppError(res.status, res.status, "Некорректный ответ сервиса");
    }
  }
  if (!res.ok) {
    throw new AppError(
      res.status,
      body.code ?? res.status,
      body.message || "Ошибка"
    );
  }
  return body as T;
}
