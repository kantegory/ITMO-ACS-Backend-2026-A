import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { UserRole } from '../common/enums';
import { ApiError } from '../common/api-error';

interface JwtPayloadWithUser extends JwtPayload {
    user: {
        id: string;
        role: UserRole;
    };
}

interface RequestWithUser extends Request {
    user?: User;
}

const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { headers } = request;
    const { authorization } = headers;

    if (!authorization) {
        return response.status(401).send({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authorization header is required',
            },
        });
    }

    try {
        const [, accessToken] = authorization.split(' ');
        if (!accessToken) {
            return response.status(401).send({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Bearer token is required',
                },
            });
        }

        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        dataSource
            .getRepository(User)
            .findOneBy({ id: user.id })
            .then((currentUser) => {
                if (!currentUser) {
                    throw new ApiError(401, 'UNAUTHORIZED', 'User is not found');
                }

                request.user = currentUser;
                next();
            })
            .catch((error) => {
                const statusCode = error instanceof ApiError ? error.httpCode : 401;

                return response.status(statusCode).send({
                    error: {
                        code:
                            error instanceof ApiError
                                ? error.code
                                : 'UNAUTHORIZED',
                        message:
                            error instanceof ApiError
                                ? error.message
                                : 'Token is invalid or expired',
                    },
                });
            });
    } catch (error) {
        return response.status(401).send({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Token is invalid or expired',
            },
        });
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
