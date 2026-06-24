import { Router } from "express"
import { LikeController } from "../controllers/like.controller"

const router = Router()

router.post(
    "/recipes/:id/like",
    LikeController.create
)

router.delete(
    "/recipes/:id/like",
    LikeController.delete
)

export default router