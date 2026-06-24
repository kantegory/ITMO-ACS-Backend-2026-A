import { Router } from "express"
import { SavedController } from "../controllers/saved.controller"

const router = Router()

router.post(
    "/recipes/:id/save",
    SavedController.create
)

router.delete(
    "/recipes/:id/save",
    SavedController.delete
)

export default router