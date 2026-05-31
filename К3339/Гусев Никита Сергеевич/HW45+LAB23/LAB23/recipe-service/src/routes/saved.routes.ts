import { Router } from "express"
import { SavedController } from "../controllers/saved.controller"

const router = Router()

router.post("/:id/save", SavedController.create)
router.delete("/:id/save", SavedController.delete)

export default router