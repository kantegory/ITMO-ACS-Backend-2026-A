import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { forbidden, unauthorized } from "../utils/errors";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(unauthorized());
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(unauthorized());
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}
