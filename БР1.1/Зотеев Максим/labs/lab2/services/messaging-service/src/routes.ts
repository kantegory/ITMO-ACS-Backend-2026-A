import { Router } from "express";
import { asyncHandler } from "./middleware/error";
import { authRequired } from "./middleware/auth";
import * as msgs from "./controllers/messages.controller";

const r = Router();

r.get("/rentals/:id/messages", authRequired, asyncHandler(msgs.getRentalMessages));
r.post("/rentals/:id/messages", authRequired, asyncHandler(msgs.sendMessage));

export default r;
