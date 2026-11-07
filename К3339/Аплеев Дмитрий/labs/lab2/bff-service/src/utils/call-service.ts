import { Request, Response } from 'express';
import { HttpError } from 'routing-controllers';

import SETTINGS from '../config/settings';

// ответ другого сервиса: код и тело (null, если тела нет, например у 204)
export interface ServiceResult {
    status: number;
    data: any;
}

// отправить запрос в другой сервис
export const callService = async (
    method: string,
    url: string,
    request?: Request,
    body?: object,
): Promise<ServiceResult> => {
    const headers: { [name: string]: string } = {
        'X-Internal-Key': SETTINGS.INTERNAL_API_KEY,
    };

    if (request && request.headers.authorization) {
        headers['Authorization'] = request.headers.authorization;
    }

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new HttpError(503, 'Service unavailable');
    }

    const text = await response.text();

    return {
        status: response.status,
        data: text ? JSON.parse(text) : null,
    };
};

export const sendResult = (response: Response, result: ServiceResult) => {
    if (result.data === null) {
        return response.status(result.status).send();
    }

    return response.status(result.status).json(result.data);
};
