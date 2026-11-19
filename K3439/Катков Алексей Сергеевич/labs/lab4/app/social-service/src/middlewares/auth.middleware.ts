import { ExpressMiddlewareInterface } from 'routing-controllers';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';

export interface RequestWithUser extends Request { user: { id: number } }

export default class AuthMiddleware implements ExpressMiddlewareInterface {
    use(request: RequestWithUser, response: Response, next: NextFunction): void {
        const header = request.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            response.status(401).json({ message: 'Token is missing' });
            return;
        }
        try {
            const payload = jwt.verify(header.slice(7), SETTINGS.JWT_SECRET_KEY, { algorithms: ['HS256'] });
            if (typeof payload === 'string' || !Number.isInteger(payload.user?.id)) {
                response.status(401).json({ message: 'Token is invalid' });
                return;
            }
            request.user = payload.user;
        } catch {
            response.status(401).json({ message: 'Token is invalid or expired' });
            return;
        }
        next();
    }
}
