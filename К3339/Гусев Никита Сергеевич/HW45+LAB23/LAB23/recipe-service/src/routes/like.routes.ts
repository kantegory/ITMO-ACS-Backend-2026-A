import { Router } from "express"
import { LikeController } from "../controllers/like.controller"

const router = Router()

router.post("/:id/like", LikeController.create)
router.delete("/:id/like", LikeController.delete)

export default router