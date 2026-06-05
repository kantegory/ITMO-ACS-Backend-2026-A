import { Router } from "express";
import { asyncHandler } from "@rental/shared";
import { authRequired, internalAuth } from "./auth";
import * as auth from "./controllers/auth.controller";
import * as users from "./controllers/users.controller";

const r = Router();

r.post("/auth/register", asyncHandler(auth.register));
r.post("/auth/login", asyncHandler(auth.login));

r.get("/users/me", authRequired, asyncHandler(users.getMe));
r.patch("/users/me", authRequired, asyncHandler(users.updateMe));

r.get("/internal/users/:userId", internalAuth, asyncHandler(users.getInternalUser));
r.post("/internal/users/batch-get", internalAuth, asyncHandler(users.batchGetInternalUsers));

export default r;
