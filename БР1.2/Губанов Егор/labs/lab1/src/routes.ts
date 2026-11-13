import { Router } from "express";
import { wrap } from "./http/wrap";
import { requireAuth } from "./middleware/auth";
import * as auth from "./controllers/authController";
import * as me from "./controllers/meController";
import * as types from "./controllers/propertyTypesController";
import * as prop from "./controllers/propertyController";
import * as deals from "./controllers/dealsController";
import * as msg from "./controllers/messagesController";
import * as hist from "./controllers/historyController";

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

  r.get(["/property-types", "/property-types/"], wrap(types.list));

  r.get(["/properties", "/properties/"], wrap(prop.listPublic));
  r.get("/properties/:id", wrap(prop.getPublic));
  r.post(["/properties", "/properties/"], requireAuth, wrap(prop.create));
  r.put("/properties/:id", requireAuth, wrap(prop.update));
  r.delete("/properties/:id", requireAuth, wrap(prop.remove));
  r.post(
    "/properties/:propertyId/photos",
    requireAuth,
    wrap(prop.addPhoto)
  );
  r.post(
    "/properties/:propertyId/conditions",
    requireAuth,
    wrap(prop.addCondition)
  );

  r.delete("/photos/:id", requireAuth, wrap(prop.deletePhoto));
  r.delete("/conditions/:id", requireAuth, wrap(prop.deleteCondition));

  r.post(["/deals", "/deals/"], requireAuth, wrap(deals.create));
  r.get("/deals/:id", requireAuth, wrap(deals.getOne));
  r.patch("/deals/:id", requireAuth, wrap(deals.patch));

  r.get(["/messages", "/messages/"], requireAuth, wrap(msg.list));
  r.post(["/messages", "/messages/"], requireAuth, wrap(msg.send));
  r.patch("/messages/:id/read", requireAuth, wrap(msg.markRead));

  r.get(["/history", "/history/"], requireAuth, wrap(hist.all));

  r.get(["/me", "/me/"], requireAuth, wrap(me.profile));
  r.get(["/me/renting", "/me/renting/"], requireAuth, wrap(me.renting));
  r.get(["/me/owning", "/me/owning/"], requireAuth, wrap(me.owning));
  r.get(
    ["/me/owning/deals", "/me/owning/deals/"],
    requireAuth,
    wrap(me.owningDeals)
  );

  return r;
}
