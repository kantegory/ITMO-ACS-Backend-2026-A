import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { UserRole } from '../models/enums/user-role.enum';

interface AuthUser {
    id: string;
    role: UserRole;
}

interface JwtPayloadWithUser extends JwtPayload {
    user: AuthUser;
}

export interface RequestWithUser extends Request {
    user: AuthUser;
}

export interface RequestWithOptionalUser extends Request {
    user?: AuthUser;
}

export const parseAuthHeader = (authorization?: string): AuthUser | null => {
    if (!authorization) {
        return null;
    }

    const [tokenType, accessToken] = authorization.split(' ');

    if (tokenType !== SETTINGS.JWT_TOKEN_TYPE || !accessToken) {
        return null;
    }

    const { user } = jwt.verify(
        accessToken,
        SETTINGS.JWT_SECRET_KEY,
    ) as JwtPayloadWithUser;

    return user;
};

const authMiddleware = (
    request: RequestWithOptionalUser,
    response: Response,
    next: NextFunction,
) => {
    try {
        const user = parseAuthHeader(request.headers.authorization);

        if (!user) {
            return response
                .status(401)
                .send({ message: 'Unauthorized: no token provided' });
        }

        request.user = user;
        next();
    } catch (error) {
        console.error(error);

        return response
            .status(403)
            .send({ message: 'Forbidden: token is invalid or expired' });
    }
};

export const optionalAuthMiddleware = (
    request: RequestWithOptionalUser,
    _response: Response,
    next: NextFunction,
) => {
    try {
        const user = parseAuthHeader(request.headers.authorization);

        if (user) {
            request.user = user;
        }
    } catch (error) {
        console.error(error);
    }

    next();
};

export { AuthUser, JwtPayloadWithUser };

export default authMiddleware;
