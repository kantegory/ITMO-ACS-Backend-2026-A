import { Router } from "express"
import { RecipeController } from "../controllers/recipe.controller"

const router = Router()

router.get("/", RecipeController.getAll)
router.post("/", RecipeController.create)

export default router