import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { unauthorized } from "../utils/errors";

export function serviceTokenMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.headers["x-service-token"];
  if (token !== env.serviceToken) {
    return next(unauthorized());
  }
  next();
}
