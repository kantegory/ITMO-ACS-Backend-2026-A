import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({
        error: "Unauthorized",
        message: "No token provided",
        status_code: 401,
      });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    res
      .status(401)
      .json({
        error: "Unauthorized",
        message: "Invalid or expired token",
        status_code: 401,
      });
    return;
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "admin" && req.user?.role !== "trainer") {
    res
      .status(403)
      .json({
        error: "Forbidden",
        message: "Admin or trainer role required",
        status_code: 403,
      });
    return;
  }
  next();
};
