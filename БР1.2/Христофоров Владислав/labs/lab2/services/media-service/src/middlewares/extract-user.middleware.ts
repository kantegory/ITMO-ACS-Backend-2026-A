import { Request, Response, NextFunction } from "express";
import { HttpError } from "routing-controllers";

export function extractUserMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const userId = req.headers["x-user-id"];

    if (!userId) {
        return next(
            new HttpError(401, "Не авторизован (Отсутствует X-User-Id)"),
        );
    }

    (req as any).user = {
        id: userId as string,
        role: (req.headers["x-user-role"] as string) || "user",
    };

    next();
}
