import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { unauthorized } from "../utils/errors";

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
