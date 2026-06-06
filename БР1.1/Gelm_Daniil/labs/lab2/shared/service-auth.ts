import type { NextFunction, Request, Response } from "express";

export function serviceTokenRequired(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["x-service-token"];
  const expected = process.env.SERVICE_TOKEN ?? "lab2_service_secret";
  if (token !== expected) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Неверный service token" });
    return;
  }
  next();
}
