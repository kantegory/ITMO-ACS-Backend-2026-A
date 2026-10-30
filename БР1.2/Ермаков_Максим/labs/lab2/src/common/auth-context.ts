import { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRole } from './enums';
import { forbidden, unauthorized } from './api-error';

export interface AuthContext {
    userId: string;
    role: UserRole;
    email?: string;
}

export interface RequestWithAuth extends Request {
    auth?: AuthContext;
}

export const authContextMiddleware: RequestHandler = (
    request: RequestWithAuth,
    _response: Response,
    next: NextFunction,
) => {
    const userId = request.header('x-user-id');
    const role = request.header('x-user-role') as UserRole | undefined;

    if (!userId || !role) {
        next(unauthorized());
        return;
    }

    request.auth = {
        userId,
        role,
        email: request.header('x-user-email') || undefined,
    };
    next();
};

export const requireRole =
    (...roles: UserRole[]): RequestHandler =>
    (request: RequestWithAuth, _response, next) => {
        if (!request.auth) {
            next(unauthorized());
            return;
        }
        if (!roles.includes(request.auth.role)) {
            next(forbidden());
            return;
        }
        next();
    };
