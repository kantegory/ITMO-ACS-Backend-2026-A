import {Router} from "express"
import {CommentController} from "../controllers/comment.controller"

const router = Router()

router.post(
    "/:id",
    CommentController.create
)

router.get(
    "/:id",
    CommentController.getByRecipe
)
export default router