import SETTINGS from './settings';
import { ApiError, serviceUnavailable, statusToCode } from './errors';
import { createServiceToken } from './auth';

type JsonBody = Record<string, unknown> | unknown[] | undefined;

type ServiceRequestOptions = {
    method?: string;
    body?: JsonBody;
    query?: Record<string, string | number | boolean | undefined>;
};

const buildUrl = (
    baseUrl: string,
    path: string,
    query?: ServiceRequestOptions['query'],
): string => {
    const url = new URL(path, `${baseUrl}/`);

    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
    }

    return url.toString();
};

export const serviceRequest = async <T>(
    baseUrl: string,
    path: string,
    callerServiceName: string,
    options: ServiceRequestOptions = {},
): Promise<T> => {
    const headers: Record<string, string> = {
        Authorization: `${SETTINGS.JWT_TOKEN_TYPE} ${createServiceToken(callerServiceName)}`,
    };

    let body: string | undefined;

    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(options.body);
    }

    let response: Response;

    try {
        response = await fetch(buildUrl(baseUrl, path, options.query), {
            method: options.method || (body ? 'POST' : 'GET'),
            headers,
            body,
        });
    } catch (_error) {
        throw serviceUnavailable('Downstream service is temporarily unavailable');
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message =
            typeof payload === 'object' && payload !== null && 'message' in payload
                ? String((payload as { message: unknown }).message)
                : `Downstream service returned ${response.status}`;

        throw new ApiError(response.status, message, statusToCode(response.status), payload);
    }

    return payload as T;
};
