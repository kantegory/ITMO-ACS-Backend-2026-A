import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth.middleware';

export default function requireAdmin(
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) {
    if (request.user?.role !== 'ADMIN') {
        return response.status(403).send({ message: 'Forbidden' });
    }

    return next();
}

