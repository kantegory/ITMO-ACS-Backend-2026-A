import { NextFunction, Response } from 'express';
import { RequestWithUser } from './auth.middleware';
import { UserRole } from '../common/enums';

const roleMiddleware =
    (...roles: UserRole[]) =>
    (request: RequestWithUser, response: Response, next: NextFunction) => {
        if (!request.user) {
            return response.status(401).send({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication is required',
                },
            });
        }

        if (!roles.includes(request.user.role)) {
            return response.status(403).send({
                error: {
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to access this resource',
                },
            });
        }

        next();
    };

export default roleMiddleware;
