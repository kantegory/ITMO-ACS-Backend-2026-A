import { ExpressMiddlewareInterface, HttpError } from 'routing-controllers';
import { Request, Response, NextFunction } from 'express';

export function RoleMiddleware(allowedRoles: string[]) {
    return class implements ExpressMiddlewareInterface {
        use(req: Request, res: Response, next: NextFunction): void {
            const userRole = (req as any).user?.role;

            if (!userRole || !allowedRoles.includes(userRole)) {
                throw new HttpError(
                    403,
                    'Отказано в доступе. Недостаточно прав.',
                );
            }

            next();
        }
    };
}
