import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";
import restaurantRoutes from "./restaurants";
import bookingRoutes from "./bookings";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/bookings", bookingRoutes);

export default router;
