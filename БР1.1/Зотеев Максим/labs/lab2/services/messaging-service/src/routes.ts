import { Router } from "express";
import { asyncHandler } from "@rental/shared";
import { authRequired } from "./auth";
import * as msgs from "./controllers/messages.controller";

const r = Router();

r.get("/rentals/:id/messages", authRequired, asyncHandler(msgs.getRentalMessages));
r.post("/rentals/:id/messages", authRequired, asyncHandler(msgs.sendMessage));

export default r;
