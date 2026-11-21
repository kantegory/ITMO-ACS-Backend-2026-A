import { Request, Response, NextFunction } from "express";
import { requireInternalKey } from "../../../../packages/shared/src/internal";

export function internalOnly(req: Request, _res: Response, next: NextFunction) {
  try {
    requireInternalKey(req.headers);
    next();
  } catch (e) {
    next(e);
  }
}
