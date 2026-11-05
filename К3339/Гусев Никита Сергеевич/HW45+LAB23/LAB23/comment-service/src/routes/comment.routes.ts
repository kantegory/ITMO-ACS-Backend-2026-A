import { Router } from "express"
import { CommentController } from "../controllers/comment.controller"
import { authMiddleware, requireUser } from "../../../shared/auth"

const router = Router()
router.post("/:id", authMiddleware, requireUser, CommentController.create)
router.get("/:id", CommentController.getByRecipe)
export default router
