import { Router } from "express";
import { BookingController } from "../controllers/BookingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, BookingController.list);
router.post("/", authMiddleware, BookingController.create);
router.get("/:bookingId", authMiddleware, BookingController.getById);
router.delete("/:bookingId", authMiddleware, BookingController.cancel);

export default router;
