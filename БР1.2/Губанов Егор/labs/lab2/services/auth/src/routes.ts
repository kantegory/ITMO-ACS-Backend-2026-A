import { Router } from "express";
import { wrap } from "../../../packages/shared/src/wrap";
import { requireAuth } from "../../../packages/shared/src/authMiddleware";
import { internalOnly } from "./middleware/internal";
import * as auth from "./controllers/authController";
import * as internal from "./controllers/internalController";

export function buildRoutes() {
  const r = Router();

  r.post(["/auth/register", "/auth/register/"], wrap(auth.register));
  r.post(["/auth/login", "/auth/login/"], wrap(auth.login));
  r.post(["/auth/refresh", "/auth/refresh/"], wrap(auth.refresh));
  r.post(
    ["/auth/password/request-reset", "/auth/password/request-reset/"],
    wrap(auth.requestReset)
  );
  r.post(
    ["/auth/password/reset", "/auth/password/reset/"],
    wrap(auth.resetPassword)
  );
  r.post(["/auth/logout", "/auth/logout/"], requireAuth, wrap(auth.logout));

  r.get(["/me", "/me/"], requireAuth, wrap(auth.profile));

  r.get(
    "/internal/v1/users/:id",
    internalOnly,
    wrap(internal.getUserBrief)
  );

  return r;
}
