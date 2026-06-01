import {
    ForbiddenError,
    HttpError,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';

import SETTINGS from '../config/settings';

export async function serviceGet<T>(baseUrl: string, path: string): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${baseUrl}${path}`, {
            headers: { 'X-Service-Token': SETTINGS.SERVICE_TOKEN },
        });
    } catch {
        throw new HttpError(503, 'Dependent service unavailable');
    }

    if (response.status === 401) {
        throw new UnauthorizedError('Invalid service token');
    }

    if (response.status === 403) {
        throw new ForbiddenError('Forbidden by dependent service');
    }

    if (response.status === 404) {
        throw new NotFoundError('Dependent entity not found');
    }

    if (response.status === 409) {
        throw new HttpError(409, 'Dependent service conflict');
    }

    if (!response.ok) {
        throw new HttpError(503, 'Dependent service unavailable');
    }

    return (await response.json()) as T;
}

export async function servicePost<T>(
    baseUrl: string,
    path: string,
    body: unknown,
): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Service-Token': SETTINGS.SERVICE_TOKEN,
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new HttpError(503, 'Dependent service unavailable');
    }

    if (response.status === 401) {
        throw new UnauthorizedError('Invalid service token');
    }

    if (response.status === 403) {
        throw new ForbiddenError('Forbidden by dependent service');
    }

    if (response.status === 404) {
        throw new NotFoundError('Dependent entity not found');
    }

    if (response.status === 409) {
        throw new HttpError(409, 'Dependent service conflict');
    }

    if (!response.ok) {
        throw new HttpError(503, 'Dependent service unavailable');
    }

    return (await response.json()) as T;
}

export type BatchResponse<T> = {
    items: T[];
    missingIds: string[];
};

export async function serviceBatchGet<T>(
    baseUrl: string,
    path: string,
    ids: string[],
): Promise<BatchResponse<T>> {
    return await servicePost<BatchResponse<T>>(baseUrl, path, { ids });
}
