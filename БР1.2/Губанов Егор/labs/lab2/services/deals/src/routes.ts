import { Router } from "express";
import { wrap } from "../../../packages/shared/src/wrap";
import { requireAuth } from "../../../packages/shared/src/authMiddleware";
import { internalOnly } from "./middleware/internal";
import * as deals from "./controllers/dealsController";
import * as internal from "./controllers/internalController";

export function buildRoutes() {
  const r = Router();

  r.post(["/deals", "/deals/"], requireAuth, wrap(deals.create));
  r.get("/deals/:id", requireAuth, wrap(deals.getOne));
  r.patch("/deals/:id", requireAuth, wrap(deals.patch));

  r.get(["/me/renting", "/me/renting/"], requireAuth, wrap(deals.renting));
  r.get(
    ["/me/owning/deals", "/me/owning/deals/"],
    requireAuth,
    wrap(deals.owningDeals)
  );

  r.get(
    "/internal/v1/users/:userId/deals",
    internalOnly,
    wrap(internal.userDealsHistory)
  );
  r.get(
    "/internal/v1/owners/:ownerId/active-deals",
    internalOnly,
    wrap(internal.ownerActiveDeals)
  );

  return r;
}
