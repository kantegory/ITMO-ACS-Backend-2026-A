import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';
import { formatErrorResponse } from '../common/api-error-response';

interface JwtPayloadWithUser extends JwtPayload {
    user: {
        user_id: number;
        role: string;
    };
}

interface RequestWithUser extends Request {
    user: {
        user_id: number;
        role: string;
    };
}

const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { headers } = request;
    const { authorization } = headers;

    try {
        if (!authorization) {
            return response
                .status(401)
                .send(
                    formatErrorResponse(
                        401,
                        'Unauthorized: no token provided',
                        request.originalUrl,
                    ),
                );
        }

        let accessToken = authorization.trim();

        if (accessToken.toLowerCase().startsWith('bearer ')) {
            accessToken = accessToken.slice(7).trim();
        }

        if (
            accessToken.startsWith('"') &&
            accessToken.endsWith('"') &&
            accessToken.length >= 2
        ) {
            accessToken = accessToken.slice(1, -1);
        }

        if (!accessToken) {
            return response
                .status(401)
                .send(
                    formatErrorResponse(
                        401,
                        'Unauthorized: no token provided',
                        request.originalUrl,
                    ),
                );
        }

        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next();
    } catch (error) {
        console.error(error);

        if (error instanceof jwt.TokenExpiredError) {
            return response
                .status(401)
                .send(
                    formatErrorResponse(
                        401,
                        'Unauthorized: token has expired, please login again',
                        request.originalUrl,
                    ),
                );
        }

        return response
            .status(403)
            .send(
                formatErrorResponse(
                    403,
                    'Forbidden: token is invalid or expired',
                    request.originalUrl,
                ),
            );
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
