import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/errors";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "bad_request", message: "Некорректный JSON в теле запроса" });
  }
  console.error(err);
  res.status(500).json({ error: "internal_error", message: "Внутренняя ошибка сервера" });
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
