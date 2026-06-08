import jwt, { SignOptions } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "./AppError";

export type UserRole = "user" | "trainer" | "admin";

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const signAccessToken = (payload: JwtPayload, secret: string, expiresIn = "1d") =>
  jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const signRefreshToken = (payload: JwtPayload, secret: string, expiresIn = "7d") =>
  jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const verifyToken = (token: string, secret: string): JwtPayload =>
  jwt.verify(token, secret) as JwtPayload;

/**
 * Middleware: проверяет JWT либо непосредственно (через JWT_SECRET в env),
 * либо доверяет X-User-Id/X-User-Role заголовкам от Gateway.
 */
export const authenticate =
  (jwtSecret: string) =>
  (req: Request, _res: Response, next: NextFunction) => {
    // 1) Доверие заголовкам от Gateway
    const userIdHeader = req.header("X-User-Id");
    const roleHeader = req.header("X-User-Role") as UserRole | undefined;
    const emailHeader = req.header("X-User-Email") ?? "";
    if (userIdHeader && roleHeader) {
      req.user = { sub: userIdHeader, email: emailHeader, role: roleHeader };
      return next();
    }

    // 2) Прямая валидация JWT
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Missing access token"));
    }
    try {
      req.user = verifyToken(header.slice("Bearer ".length), jwtSecret);
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
