import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import {
    ForbiddenError,
    UnauthorizedError,
    ExpressMiddlewareInterface,
    Middleware,
} from 'routing-controllers';

import SETTINGS from '../config/settings';
import { UserRole } from '../enums/role.enum';

interface JwtPayloadWithUser extends JwtPayload {
    user: {
        id: number;
        role: UserRole;
    };
}

interface RequestWithUser extends Request {
    user: JwtPayloadWithUser['user'];
}

@Middleware({ type: 'before' })
class AuthMiddleware implements ExpressMiddlewareInterface {
    use(request: RequestWithUser, _response: Response, next: NextFunction) {
        const { headers } = request;
        const { authorization } = headers;

        if (!authorization) {
            throw new UnauthorizedError('Unauthorized: no token provided');
        }

        try {
            const [, accessToken] = authorization.split(' ');

            if (!accessToken) {
                throw new UnauthorizedError('Unauthorized: no token provided');
            }

            const { user }: JwtPayloadWithUser = jwt.verify(
                accessToken,
                SETTINGS.JWT_SECRET_KEY,
            ) as JwtPayloadWithUser;

            request.user = user;
            next();
        } catch (error) {
            console.error(error);

            throw new ForbiddenError(
                'Forbidden: token is invalid or expired',
            );
        }
    }
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
                .send({ message: 'Unauthorized: no token provided' });
        }

        const [, accessToken] = authorization.split(' ');

        if (!accessToken) {
            return response
                .status(401)
                .send({ message: 'Unauthorized: no token provided' });
        }

        const { user }: JwtPayloadWithUser = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next();
    } catch (error) {
        console.error(error);

        return response
            .status(403)
            .send({ message: 'Forbidden: token is invalid or expired' });
    }
};

export function requireRole(roles: UserRole[]) {
    return (
        request: RequestWithUser,
        _response: Response,
        next: NextFunction,
    ) => {
        if (!request.user || !roles.includes(request.user.role)) {
            throw new ForbiddenError('Access denied');
        }

        next();
    };
}

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
export { AuthMiddleware };
