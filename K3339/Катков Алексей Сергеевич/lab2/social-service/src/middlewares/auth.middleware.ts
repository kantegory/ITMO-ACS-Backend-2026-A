import { ExpressMiddlewareInterface, ForbiddenError } from 'routing-controllers';
import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';

export interface RequestWithUser extends Request { user: { id: number } }

export default class AuthMiddleware implements ExpressMiddlewareInterface {
    use(request: any, response: any, next: (err?: any) => any): void {
        const header = request.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            next(new ForbiddenError('Token is missing'));
            return;
        }
        try {
            const token = header.replace('Bearer ', '');
            const payload = jwt.verify(token, SETTINGS.JWT_SECRET_KEY) as any;
            request.user = payload.user;
            next();
        } catch {
            next(new ForbiddenError('Token is invalid or expired'));
        }
    }
}
