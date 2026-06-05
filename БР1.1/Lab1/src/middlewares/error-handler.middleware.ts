import { NextFunction, Request, Response } from 'express';
import {
    ExpressErrorMiddlewareInterface,
    HttpError,
    Middleware,
    BadRequestError,
} from 'routing-controllers';
import { QueryFailedError } from 'typeorm';

import { statusToErrorCode } from '../errors/error-codes';

type ValidationErrorShape = {
    property?: string;
    constraints?: Record<string, string>;
    children?: ValidationErrorShape[];
};

const collectValidationMessages = (
    errors: ValidationErrorShape[] = [],
    parentPath = '',
): string[] => {
    const messages: string[] = [];

    for (const error of errors) {
        const path = parentPath
            ? `${parentPath}.${error.property ?? ''}`
            : error.property ?? '';

        if (error.constraints) {
            for (const constraintMessage of Object.values(error.constraints)) {
                if (path) {
                    messages.push(`${path}: ${constraintMessage}`);
                } else {
                    messages.push(constraintMessage);
                }
            }
        }

        if (error.children && error.children.length > 0) {
            messages.push(...collectValidationMessages(error.children, path));
        }
    }

    return messages;
};

@Middleware({ type: 'after' })
class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
    error(
        error: unknown,
        _request: Request,
        response: Response,
        _next: NextFunction,
    ): void {
        const queryError = error as QueryFailedError & {
            driverError?: { code?: string; detail?: string };
        };

        if (queryError?.driverError?.code === '23505') {
            response.status(409).send({
                code: statusToErrorCode(409),
                message: queryError.driverError.detail || 'Conflict',
            });
            return;
        }

        const routingError = error as HttpError & {
            errors?: ValidationErrorShape[];
            message?: string;
            httpCode?: number;
        };

        const validationDetails = collectValidationMessages(routingError.errors || []);
        const hasValidationErrors = validationDetails.length > 0;

        const statusCode = hasValidationErrors
            ? 400
            : routingError.httpCode || (routingError instanceof BadRequestError ? 400 : 500);

        response.status(statusCode).send({
            code: statusToErrorCode(statusCode, hasValidationErrors),
            message: routingError.message || 'Internal server error',
            ...(hasValidationErrors ? { details: validationDetails } : {}),
        });
    }
}

export default ErrorHandlerMiddleware;
