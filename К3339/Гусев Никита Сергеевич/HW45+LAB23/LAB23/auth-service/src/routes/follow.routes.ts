import { Router } from "express"
import { FollowController } from "../controllers/follow.controller"

const router = Router()

router.post(
    "/users/:id/follow",
    FollowController.create
)

router.delete(
    "/users/:id/follow",
    FollowController.delete
)

export default router