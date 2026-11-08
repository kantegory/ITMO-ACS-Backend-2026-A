import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import SETTINGS from './settings';
import { unauthorized } from './errors';

export type RequestUser = {
    id: number;
};

export interface RequestWithUser extends Request {
    user?: RequestUser;
}

type UserJwtPayload = JwtPayload & {
    user?: RequestUser;
};

type ServiceJwtPayload = JwtPayload & {
    service?: string;
};

const extractBearerToken = (authorization?: string): string => {
    if (!authorization) {
        throw unauthorized('Authorization header is missing');
    }

    const [tokenType, token] = authorization.split(' ');

    if (!tokenType || !token) {
        throw unauthorized('Authorization header format must be: Bearer <token>');
    }

    if (tokenType.toLowerCase() !== SETTINGS.JWT_TOKEN_TYPE.toLowerCase()) {
        throw unauthorized('Unsupported authorization token type');
    }

    return token;
};

export const createAccessToken = (userId: number): string => {
    return jwt.sign(
        {
            user: {
                id: userId,
            },
        },
        SETTINGS.JWT_SECRET_KEY,
        {
            expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
        },
    );
};

export const createServiceToken = (serviceName: string): string => {
    return jwt.sign(
        {
            service: serviceName,
        },
        SETTINGS.SERVICE_JWT_SECRET,
        {
            expiresIn: SETTINGS.SERVICE_TOKEN_LIFETIME,
        },
    );
};

export const requireUser = (
    request: RequestWithUser,
    _response: Response,
    next: NextFunction,
): void => {
    try {
        const token = extractBearerToken(request.headers.authorization);
        const payload = jwt.verify(token, SETTINGS.JWT_SECRET_KEY) as UserJwtPayload;

        if (!payload.user?.id) {
            throw unauthorized('Token payload is invalid');
        }

        request.user = { id: Number(payload.user.id) };
        next();
    } catch (error) {
        if (
            error instanceof Error &&
            ['JsonWebTokenError', 'TokenExpiredError'].includes(error.name)
        ) {
            next(unauthorized('Token is invalid or expired'));
            return;
        }

        next(error);
    }
};

export const requireServiceToken = (
    request: Request,
    _response: Response,
    next: NextFunction,
): void => {
    try {
        const token = extractBearerToken(request.headers.authorization);
        const payload = jwt.verify(token, SETTINGS.SERVICE_JWT_SECRET) as ServiceJwtPayload;

        if (!payload.service) {
            throw unauthorized('Service token payload is invalid');
        }

        next();
    } catch (error) {
        if (
            error instanceof Error &&
            ['JsonWebTokenError', 'TokenExpiredError'].includes(error.name)
        ) {
            next(unauthorized('Service token is invalid or expired'));
            return;
        }

        next(error);
    }
};
