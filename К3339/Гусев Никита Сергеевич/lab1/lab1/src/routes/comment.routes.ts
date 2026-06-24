import { Router } from "express"
import { CommentController } from "../controllers/comment.controller"

const router = Router()

router.post(
    "/recipes/:id/comments",
    CommentController.create
)

export default router