import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
};

export const errorHandler =
  (serviceName: string) =>
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res
        .status(err.statusCode)
        .json({ error: err.message, details: err.details });
    }
    console.error(`[${serviceName}]`, err);
    res.status(500).json({ error: "Internal server error" });
  };
