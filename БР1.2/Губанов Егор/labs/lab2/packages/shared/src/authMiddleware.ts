import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "./jwt";
import { E } from "./errors";
import { AuthUser } from "./types";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) throw E.unauthorized();
    const payload = verifyAccess(h.slice(7));
    req.authUser = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    next(e instanceof Error && "statusCode" in e ? e : E.unauthorized());
  }
}
