import { Router } from "express";
import { asyncHandler } from "@rental/shared";
import { authRequired, internalAuth } from "./auth";
import * as rentals from "./controllers/rentals.controller";
import * as internal from "./controllers/internal.controller";

const r = Router();

r.post("/properties/:id/rentals", authRequired, asyncHandler(rentals.createRental));
r.get("/users/me/rentals", authRequired, asyncHandler(rentals.getMyRentals));
r.get("/rentals/:id", authRequired, asyncHandler(rentals.getRental));
r.post("/rentals/:id/complete", authRequired, asyncHandler(rentals.completeRental));
r.post("/rentals/:id/cancel", authRequired, asyncHandler(rentals.cancelRental));

r.get("/internal/rentals/:rentalId", internalAuth, asyncHandler(internal.getInternalRental));
r.get("/internal/rentals/:rentalId/participants", internalAuth, asyncHandler(internal.getRentalParticipants));

export default r;
