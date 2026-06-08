import { Router } from "express";
import { InternalUserController } from "../controllers/InternalUserController";
const router = Router();
router.get("/users/:id", (req, res) => InternalUserController.getById(req, res));
export default router;