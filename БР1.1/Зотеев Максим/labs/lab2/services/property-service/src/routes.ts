import { Router } from "express";
import { asyncHandler } from "@rental/shared";
import { authRequired, internalAuth } from "./auth";
import * as props from "./controllers/properties.controller";
import * as refs from "./controllers/refs.controller";
import * as internal from "./controllers/internal.controller";
import * as users from "./controllers/users.controller";

const r = Router();

r.get("/property-types", asyncHandler(refs.getPropertyTypes));
r.get("/amenities", asyncHandler(refs.getAmenities));

r.get("/users/me/properties", authRequired, asyncHandler(users.getMyProperties));

r.get("/properties", asyncHandler(props.searchProperties));
r.post("/properties", authRequired, asyncHandler(props.createProperty));
r.get("/properties/:id", asyncHandler(props.getProperty));
r.put("/properties/:id", authRequired, asyncHandler(props.updateProperty));
r.delete("/properties/:id", authRequired, asyncHandler(props.deleteProperty));

r.post("/properties/:id/photos", authRequired, asyncHandler(props.addPhoto));
r.delete("/properties/:id/photos/:photoId", authRequired, asyncHandler(props.deletePhoto));

r.get("/internal/properties/:propertyId/rental-context", internalAuth, asyncHandler(internal.getRentalContext));
r.put("/internal/properties/:propertyId/availability", internalAuth, asyncHandler(internal.updateAvailability));

export default r;
