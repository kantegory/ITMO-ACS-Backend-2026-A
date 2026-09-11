import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError, type ZodType } from "zod";

export type Role = "user" | "admin";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "REQUEST_FAILED",
  ) {
    super(message);
  }
}

export const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export function validate<T>(schema: ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export function authRequired(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Bearer token is required", "UNAUTHORIZED"));
    return;
  }

  try {
    req.auth = jwt.verify(header.slice(7), jwtSecret()) as AccessTokenPayload;
    next();
  } catch {
    next(new HttpError(401, "Token is invalid or expired", "UNAUTHORIZED"));
  }
}

export function adminRequired(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.auth?.role !== "admin") {
    next(new HttpError(403, "Administrator role is required", "FORBIDDEN"));
    return;
  }
  next();
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "2h" });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues,
    });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ code: error.code, message: error.message });
    return;
  }
  console.error(error);
  res
    .status(500)
    .json({ code: "INTERNAL_ERROR", message: "Unexpected server error" });
}

export function notFound(req: Request, res: Response): void {
  res
    .status(404)
    .json({
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} was not found`,
    });
}

export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined)
    throw new Error(`Environment variable ${name} is required`);
  return value;
}

export function jwtSecret(): string {
  return env("JWT_SECRET", "development-secret-change-me");
}

export function health(service: string) {
  return { service, status: "ok", timestamp: new Date().toISOString() };
}

