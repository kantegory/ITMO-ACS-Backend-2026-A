import { RequestHandler } from "express";
import { Jwt, JwtPayload } from "./jwt";
import { unauthorized } from "./errors";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthOptions {
  jwt: Jwt;
  internalToken?: string;
}

export interface Auth {
  authRequired: RequestHandler;
  internalAuth: RequestHandler;
}

export const createAuth = ({ jwt, internalToken }: AuthOptions): Auth => {
  const authRequired: RequestHandler = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return next(unauthorized());
    try {
      req.user = jwt.verify(header.slice(7));
      next();
    } catch {
      next(unauthorized("Невалидный токен"));
    }
  };

  const internalAuth: RequestHandler = (req, _res, next) => {
    const token = req.headers["x-internal-service-token"];
    if (!internalToken || !token || token !== internalToken) {
      return next(unauthorized("Невалидный служебный токен"));
    }
    next();
  };

  return { authRequired, internalAuth };
};
