import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import SETTINGS from '../config/settings';
import { UserRole } from '../models/enums';

export interface AuthUser {
    userId: number;
    role: UserRole;
    profileId: number | null;
}

export interface RequestWithUser extends Request {
    user: AuthUser;
}

const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const authorization = request.headers.authorization;

    if (!authorization) {
        return response.status(401).send({
            message: 'Unauthorized',
        });
    }

    const [tokenType, accessToken] = authorization.split(' ');

    if (tokenType !== SETTINGS.JWT_TOKEN_TYPE || !accessToken) {
        return response.status(401).send({
            message: 'Unauthorized',
        });
    }

    try {
        const payload = jwt.verify(accessToken, SETTINGS.JWT_SECRET_KEY) as {
            user: AuthUser;
        };

        request.user = payload.user;

        next();
    } catch (error) {
        return response.status(403).send({
            message: 'Forbidden',
        });
    }
};

export default authMiddleware;
