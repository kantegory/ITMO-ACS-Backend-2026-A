import { Request, Response, NextFunction } from "express";

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.header("X-Internal-Token");
  const expected = process.env.INTERNAL_SERVICE_TOKEN;
  if (!expected || token !== expected) {
    res.status(403).json({
      error: { code: "forbidden", message: "недопустимый внутренний токен сервиса" },
    });
    return;
  }
  next();
}
