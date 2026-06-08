import { Request, Response, NextFunction } from "express";
import { HttpError } from "routing-controllers";

export function roleMiddleware(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.headers["x-user-role"] as string;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return next(
                new HttpError(403, "Отказано в доступе. Недостаточно прав."),
            );
        }

        next();
    };
}
