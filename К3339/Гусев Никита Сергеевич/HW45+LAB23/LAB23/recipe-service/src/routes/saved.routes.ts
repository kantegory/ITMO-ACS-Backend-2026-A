import { Router } from "express"
import { SavedController } from "../controllers/saved.controller"
import { authMiddleware, requireUser } from "../../../shared/auth"

const router = Router()
router.post("/:id/save", authMiddleware, requireUser, SavedController.create)
router.delete("/:id/save", authMiddleware, requireUser, SavedController.delete)
export default router
