import { Router } from "express"
import { LikeController } from "../controllers/like.controller"
import { authMiddleware, requireUser } from "../../../shared/auth"

const router = Router()
router.post("/:id/like", authMiddleware, requireUser, LikeController.create)
router.delete("/:id/like", authMiddleware, requireUser, LikeController.delete)
export default router
