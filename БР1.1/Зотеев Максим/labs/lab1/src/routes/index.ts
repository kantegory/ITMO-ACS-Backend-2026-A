import { Router } from "express";
import { asyncHandler } from "../middleware/error";
import { authRequired } from "../middleware/auth";
import * as auth from "../controllers/auth.controller";
import * as users from "../controllers/users.controller";
import * as props from "../controllers/properties.controller";
import * as refs from "../controllers/refs.controller";
import * as rentals from "../controllers/rentals.controller";
import * as msgs from "../controllers/messages.controller";

const r = Router();

r.post("/auth/register", asyncHandler(auth.register));
r.post("/auth/login", asyncHandler(auth.login));

r.get("/users/me", authRequired, asyncHandler(users.getMe));
r.patch("/users/me", authRequired, asyncHandler(users.updateMe));
r.get(
  "/users/me/properties",
  authRequired,
  asyncHandler(users.getMyProperties),
);
r.get("/users/me/rentals", authRequired, asyncHandler(users.getMyRentals));

r.get("/property-types", asyncHandler(refs.getPropertyTypes));
r.get("/amenities", asyncHandler(refs.getAmenities));

r.get("/properties", asyncHandler(props.searchProperties));
r.post("/properties", authRequired, asyncHandler(props.createProperty));
r.get("/properties/:id", asyncHandler(props.getProperty));
r.put("/properties/:id", authRequired, asyncHandler(props.updateProperty));
r.delete("/properties/:id", authRequired, asyncHandler(props.deleteProperty));

r.post("/properties/:id/photos", authRequired, asyncHandler(props.addPhoto));
r.delete(
  "/properties/:id/photos/:photoId",
  authRequired,
  asyncHandler(props.deletePhoto),
);

r.post(
  "/properties/:id/rentals",
  authRequired,
  asyncHandler(rentals.createRental),
);
r.get("/rentals/:id", authRequired, asyncHandler(rentals.getRental));
r.post(
  "/rentals/:id/complete",
  authRequired,
  asyncHandler(rentals.completeRental),
);
r.post("/rentals/:id/cancel", authRequired, asyncHandler(rentals.cancelRental));

r.get(
  "/rentals/:id/messages",
  authRequired,
  asyncHandler(msgs.getRentalMessages),
);
r.post("/rentals/:id/messages", authRequired, asyncHandler(msgs.sendMessage));

export default r;
