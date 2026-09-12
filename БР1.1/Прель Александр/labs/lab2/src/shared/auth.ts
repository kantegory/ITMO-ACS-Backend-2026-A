import { timingSafeEqual } from "node:crypto";
import { RequestHandler } from "express";
import { asyncHandler } from "./async-handler";
import { required, serviceUrl } from "./config";
import { unauthorized } from "./errors";
import { internalRequest } from "./http";

export type Principal = {
  userId: number; firstName: string; lastName: string; email: string; phone: string;
  createdAt: string; updatedAt: string;
};

declare global {
  namespace Express { interface Request { user?: Principal; } }
}

export const requireService: RequestHandler = (req, _res, next) => {
  const supplied = Buffer.from(req.header("x-service-key") ?? "");
  const expected = Buffer.from(required("SERVICE_KEY"));
  next(supplied.length === expected.length && timingSafeEqual(supplied, expected) ? undefined : unauthorized());
};

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) throw unauthorized();
  req.user = await internalRequest<Principal>(`${serviceUrl("ACCOUNTS")}/internal/auth/verify`, authorization);
  next();
});
