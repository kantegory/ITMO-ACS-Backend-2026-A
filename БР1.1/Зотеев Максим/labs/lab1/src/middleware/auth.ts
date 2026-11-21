import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { unauthorized, forbidden } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authRequired = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized());
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(unauthorized("Невалидный токен"));
  }
};

export const requireRole = (role: "tenant" | "landlord") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden(`Требуется роль ${role}`));
    next();
  };
