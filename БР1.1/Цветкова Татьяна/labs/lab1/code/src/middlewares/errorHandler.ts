import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const notFoundHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(404).json({ error: "Endpoint not found" });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
