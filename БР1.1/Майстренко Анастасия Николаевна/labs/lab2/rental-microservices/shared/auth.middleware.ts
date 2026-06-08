import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'secret';

interface JwtPayloadWithUser extends JwtPayload {
    user: { id: number; role?: string };
}

export interface RequestWithUser extends Request {
    user: { id: number; role?: string };
}

/**
 * Stateless-проверка JWT. Все сервисы используют общий секрет, поэтому
 * могут проверять токен локально без обращения к Identity Service.
 */
const authMiddleware = (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const authorization = request.headers.authorization;
    try {
        if (!authorization) {
            return response.status(401).send({ code: 'UNAUTHORIZED', message: 'Токен не передан' });
        }
        const [, token] = authorization.split(' ');
        if (!token) {
            return response.status(401).send({ code: 'UNAUTHORIZED', message: 'Токен не передан' });
        }
        const { user } = jwt.verify(token, JWT_SECRET) as JwtPayloadWithUser;
        request.user = user;
        next();
    } catch {
        return response.status(401).send({ code: 'UNAUTHORIZED', message: 'Токен недействителен или истёк' });
    }
};

export default authMiddleware;
