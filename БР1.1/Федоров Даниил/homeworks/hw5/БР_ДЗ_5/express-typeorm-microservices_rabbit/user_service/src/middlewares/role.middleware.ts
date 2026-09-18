import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth.middleware';
import { UserRole } from '../models/enums';

const allowRoles = (...roles: UserRole[]) => {
    return (
        request: RequestWithUser,
        response: Response,
        next: NextFunction,
    ) => {
        if (!request.user || !roles.includes(request.user.role)) {
            return response.status(403).send({
                message: 'Forbidden',
            });
        }

        next();
    };
};

export default allowRoles;