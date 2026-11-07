import {
    BadRequestError,
    ForbiddenError,
    HttpError,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';

export const ensureFound = <T>(
    value: T | null | undefined,
    message = 'Resource not found',
): T => {
    if (!value) {
        throw new NotFoundError(message);
    }

    return value;
};

export const ensureForbidden = (
    condition: boolean,
    message = 'Forbidden',
): void => {
    if (!condition) {
        throw new ForbiddenError(message);
    }
};

export const ensureBadRequest = (condition: boolean, message: string): void => {
    if (!condition) {
        throw new BadRequestError(message);
    }
};

export const ensureConflict = (condition: boolean, message: string): void => {
    if (!condition) {
        throw new HttpError(409, message);
    }
};

export const ensureAuthenticated = (
    condition: boolean,
    message = 'Unauthorized',
): void => {
    if (!condition) {
        throw new UnauthorizedError(message);
    }
};
