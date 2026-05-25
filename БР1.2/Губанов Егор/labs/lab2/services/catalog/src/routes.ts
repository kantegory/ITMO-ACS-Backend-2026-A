import { Router } from "express";
import { wrap } from "../../../packages/shared/src/wrap";
import { requireAuth } from "../../../packages/shared/src/authMiddleware";
import { internalOnly } from "./middleware/internal";
import * as types from "./controllers/propertyTypesController";
import * as prop from "./controllers/propertyController";
import * as internal from "./controllers/internalController";

export function buildRoutes() {
  const r = Router();

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

  r.get(
    "/internal/v1/properties/:id",
    internalOnly,
    wrap(internal.getPropertySnapshot)
  );
  r.get(
    "/internal/v1/owners/:ownerId/properties",
    internalOnly,
    wrap(internal.listOwnerProperties)
  );

  return r;
}
