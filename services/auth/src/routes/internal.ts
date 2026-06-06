import { Router } from "express";
import { InternalController } from "../controllers/auth.controller";
import { serviceTokenMiddleware } from "../middleware/serviceToken";

const router = Router();

router.use(serviceTokenMiddleware);
router.get("/users/:id", InternalController.getUser);
router.get("/users/:id/validate", InternalController.validateUser);

export default router;
