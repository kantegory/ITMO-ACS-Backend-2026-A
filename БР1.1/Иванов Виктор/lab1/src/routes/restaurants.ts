import { Router } from "express";
import { RestaurantController } from "../controllers/RestaurantController";
import { ReviewController } from "../controllers/ReviewController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", RestaurantController.list);
router.get("/:restaurantId", RestaurantController.getById);
router.get("/:restaurantId/tables", RestaurantController.getTables);
router.get("/:restaurantId/availability", RestaurantController.checkAvailability);
router.get("/:restaurantId/reviews", ReviewController.list);
router.post("/:restaurantId/reviews", authMiddleware, ReviewController.create);

export default router;
