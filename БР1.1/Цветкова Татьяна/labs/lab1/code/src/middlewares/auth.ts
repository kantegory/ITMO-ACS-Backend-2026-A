import { NextFunction, Request, Response } from "express";
import { UserRole } from "../entities/User";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing access token"));
  }
  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
