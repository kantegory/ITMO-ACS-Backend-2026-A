import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { QueryFailedError } from "typeorm";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof QueryFailedError && (err as any).code === "23505") {
    res.status(409).json({ error: "already exists" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
