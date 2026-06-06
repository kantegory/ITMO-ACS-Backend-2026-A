import { Router } from "express";
import { InternalController } from "../controllers/vacancy.controller";
import { serviceTokenMiddleware } from "../middleware/serviceToken";

const router = Router();

router.use(serviceTokenMiddleware);
router.get("/companies/:id", InternalController.getCompany);

export default router;
