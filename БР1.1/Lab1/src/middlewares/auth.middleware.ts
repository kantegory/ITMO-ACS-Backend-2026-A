import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedError } from 'routing-controllers';

import SETTINGS from '../config/settings';

interface RequestUser {
    id: number;
}

interface JwtPayloadWithUser extends JwtPayload {
    user: RequestUser;
}

export interface RequestWithUser extends Request {
    user: RequestUser;
}

const authMiddleware = (
    request: RequestWithUser,
    _response: Response,
    next: NextFunction,
): void => {
    const authorization = request.headers.authorization;

    if (!authorization) {
        throw new UnauthorizedError('Authorization header is missing');
    }

    const [tokenType, accessToken] = authorization.split(' ');

    if (!tokenType || !accessToken) {
        throw new UnauthorizedError('Authorization header format must be: Bearer <token>');
    }

    if (tokenType.toLowerCase() !== SETTINGS.JWT_TOKEN_TYPE.toLowerCase()) {
        throw new UnauthorizedError('Unsupported authorization token type');
    }

    try {
        const payload = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        if (!payload.user?.id) {
            throw new UnauthorizedError('Token payload is invalid');
        }

        request.user = { id: payload.user.id };
        next();
    } catch (_error) {
        throw new UnauthorizedError('Token is invalid or expired');
    }
};

export default authMiddleware;
