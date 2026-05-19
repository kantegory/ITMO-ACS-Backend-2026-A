import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

export type ErrorResponse = {
    code: string;
    message: string;
    details?: unknown;
};

export class ApiError extends Error {
    status: number;

    code: string;

    details?: unknown;

    constructor(status: number, message: string, code?: string, details?: unknown) {
        super(message);
        this.status = status;
        this.code = code || statusToCode(status);
        this.details = details;
    }
}

export const statusToCode = (status: number): string => {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 409:
            return 'CONFLICT';
        case 503:
            return 'SERVICE_UNAVAILABLE';
        default:
            return 'INTERNAL_ERROR';
    }
};

export const badRequest = (message: string, details?: unknown): ApiError =>
    new ApiError(400, message, 'BAD_REQUEST', details);

export const unauthorized = (message: string): ApiError =>
    new ApiError(401, message, 'UNAUTHORIZED');

export const forbidden = (message: string): ApiError =>
    new ApiError(403, message, 'FORBIDDEN');

export const notFound = (message: string, code = 'NOT_FOUND'): ApiError =>
    new ApiError(404, message, code);

export const conflict = (message: string): ApiError =>
    new ApiError(409, message, 'CONFLICT');

export const serviceUnavailable = (message: string): ApiError =>
    new ApiError(503, message, 'SERVICE_UNAVAILABLE');

export const errorHandler = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
): void => {
    const queryError = error as QueryFailedError & {
        driverError?: { code?: string; detail?: string };
    };

    if (queryError?.driverError?.code === '23505') {
        response.status(409).json({
            code: 'CONFLICT',
            message: queryError.driverError.detail || 'Unique constraint violation',
        });
        return;
    }

    if (error instanceof ApiError) {
        const body: ErrorResponse = {
            code: error.code,
            message: error.message,
        };

        if (error.details !== undefined) {
            body.details = error.details;
        }

        response.status(error.status).json(body);
        return;
    }

    const message = error instanceof Error ? error.message : 'Internal server error';

    response.status(500).json({
        code: 'INTERNAL_ERROR',
        message,
    });
};

export const notFoundHandler = (request: Request, _response: Response): void => {
    throw notFound(`Route ${request.method} ${request.path} not found`);
};
