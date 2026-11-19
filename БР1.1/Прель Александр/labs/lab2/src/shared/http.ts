import { ApiError, unavailable, upstreamTimeout } from "./errors";
import { required } from "./config";

export const upstream = async (url: string, init: RequestInit = {}, timeoutMs = 2000) => {
  try {
    const response = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
    const body: unknown = init.method === "HEAD" || response.status === 204 ? null : await response.json();
    return { status: response.status, body };
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw upstreamTimeout();
    throw unavailable();
  }
};

export const internalRequest = async <T>(url: string, authorization?: string): Promise<T> => {
  const response = await upstream(url, { headers: {
    "x-service-key": required("SERVICE_KEY"),
    ...(authorization ? { authorization } : {}),
  } });
  if (response.status >= 400) {
    const body = response.body as { error?: { code: ApiError["code"]; message: string } };
    if ([400, 401, 404, 422].includes(response.status) && body.error) {
      throw new ApiError(response.status, body.error.code, body.error.message);
    }
    if (response.status === 504) throw upstreamTimeout();
    throw unavailable();
  }
  return response.body as T;
};
