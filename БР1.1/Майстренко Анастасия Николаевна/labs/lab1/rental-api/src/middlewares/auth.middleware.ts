import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

interface JwtPayloadWithUser extends JwtPayload {
    user: { id: number; role?: string };
}

interface RequestWithUser extends Request {
    user: { id: number; role?: string };
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
                .send({ code: 'UNAUTHORIZED', message: 'Токен не передан' });
        }

        const [, accessToken] = authorization.split(' ');

        if (!accessToken) {
            return response
                .status(401)
                .send({ code: 'UNAUTHORIZED', message: 'Токен не передан' });
        }

        const { user } = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as JwtPayloadWithUser;

        request.user = user;

        next();
    } catch (error) {
        return response.status(401).send({
            code: 'UNAUTHORIZED',
            message: 'Токен недействителен или истёк',
        });
    }
};

export { JwtPayloadWithUser, RequestWithUser };

export default authMiddleware;
