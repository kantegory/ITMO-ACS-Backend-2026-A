import cors from 'cors';
import express, { ErrorRequestHandler, RequestHandler } from 'express';
import { QueryFailedError } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ApiError } from './api-error';

export const asyncHandler =
    (handler: RequestHandler): RequestHandler =>
    (request, response, next) => {
        Promise.resolve(handler(request, response, next)).catch(next);
    };

export const createServiceApp = (serviceName: string) => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use((request, response, next) => {
        const requestId = request.header('x-request-id') || randomUUID();
        response.setHeader('x-request-id', requestId);
        (request as any).requestId = requestId;
        next();
    });

    app.get('/health', (_request, response) => {
        response.send({ status: 'ok', service: serviceName });
    });

    return app;
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if (error instanceof ApiError) {
        response.status(error.httpCode).send({
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
        });
        return;
    }

    if (error instanceof QueryFailedError) {
        response.status(409).send({
            error: {
                code: 'DATABASE_CONFLICT',
                message: 'Database conflict',
            },
        });
        return;
    }

    response.status(500).send({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: error?.message || 'Unexpected server error',
        },
    });
};
