import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "./types";

const JWT_SECRET = process.env.JWT_SECRET ?? "lab1_secret";

export type AuthPayload = {
  userId: number;
  role: UserRole;
};

export type AuthRequest = Request & { auth?: AuthPayload };

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Требуется авторизация" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.auth = decoded;
    next();
  } catch {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Невалидный токен" });
  }
}

export function roleRequired(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({ code: "FORBIDDEN", message: "Недостаточно прав" });
      return;
    }
    next();
  };
}
