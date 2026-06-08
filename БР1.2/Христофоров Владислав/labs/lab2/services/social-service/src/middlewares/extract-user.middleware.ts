import { Request, Response, NextFunction } from "express";
import { HttpError } from "routing-controllers";

export function extractUserMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];

    if (!userId) {
        return next(
            new HttpError(
                401,
                "Не авторизован (Отсутствует X-User-Id от шлюза)",
            ),
        );
    }

    (req as any).user = {
        id: userId as string,
        role: (userRole as string) || "user",
    };

    next();
}
