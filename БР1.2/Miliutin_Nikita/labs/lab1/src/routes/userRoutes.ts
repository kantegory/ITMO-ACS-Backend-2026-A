import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController";
import { authRequired } from "../middleware/auth";

export const userRoutes = Router();

userRoutes.get("/me", authRequired, getProfile);
userRoutes.put("/me", authRequired, updateProfile);
