import { Router } from "express"
import { FollowController } from "../controllers/follow.controller"
import { authMiddleware } from "../../../shared/auth"

const router = Router()
router.post("/users/:id/follow", authMiddleware, FollowController.create)
router.delete("/users/:id/follow", authMiddleware, FollowController.delete)
export default router
