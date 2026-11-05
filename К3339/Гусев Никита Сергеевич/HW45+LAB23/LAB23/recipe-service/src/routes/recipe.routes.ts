import { Router } from "express"
import { RecipeController } from "../controllers/recipe.controller"
import { authMiddleware, requireUser } from "../../../shared/auth"

const router = Router()
router.get("/", RecipeController.getAll)
router.get("/:id", RecipeController.getOne)
router.post("/", authMiddleware, requireUser, RecipeController.create)
router.patch("/:id", authMiddleware, requireUser, RecipeController.update)
router.delete("/:id", authMiddleware, requireUser, RecipeController.delete)
export default router
