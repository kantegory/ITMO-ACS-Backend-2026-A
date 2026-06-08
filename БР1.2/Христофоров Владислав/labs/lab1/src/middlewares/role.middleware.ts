import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'routing-controllers';

export default function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return next(
                new HttpError(403, 'Отказано в доступе. Недостаточно прав.'),
            );
        }

        next();
    };
}
