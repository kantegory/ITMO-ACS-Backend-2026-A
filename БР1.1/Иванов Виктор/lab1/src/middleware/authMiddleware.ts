import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "unauthorized",
        message: "требуется авторизация. предоставьте валидный JWT токен",
      },
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    req.user = { id: payload.id };
    next();
  } catch {
    res.status(401).json({
      error: {
        code: "unauthorized",
        message: "невалидный или истёкший токен",
      },
    });
  }
}
