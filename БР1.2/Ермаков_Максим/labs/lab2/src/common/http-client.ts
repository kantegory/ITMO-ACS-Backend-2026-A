import { ApiError } from './api-error';

type RequestOptions = {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    requestId?: string;
};

export const serviceRequest = async <T>(
    baseUrl: string,
    path: string,
    options: RequestOptions = {},
): Promise<T> => {
    const result = await serviceRequestRaw<T>(baseUrl, path, options);
    return result.payload;
};

export const serviceRequestRaw = async <T>(
    baseUrl: string,
    path: string,
    options: RequestOptions = {},
): Promise<{ status: number; payload: T }> => {
    const response = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers: {
            'content-type': 'application/json',
            ...(options.requestId ? { 'x-request-id': options.requestId } : {}),
            ...(options.headers || {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
        throw new ApiError(
            response.status,
            payload?.error?.code || 'UPSTREAM_ERROR',
            payload?.error?.message || 'Upstream service error',
            payload?.error?.details,
        );
    }

    return {
        status: response.status,
        payload: payload as T,
    };
};
