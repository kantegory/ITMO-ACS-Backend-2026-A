import { Router } from "express"
import { AuthController } from "../controllers/auth.controller"
import { authMiddleware } from "../middlewares/auth.middleware"
import { getMe } from "../controllers/user.controller"

const router = Router()

router.post("/register", AuthController.register)
router.post("/login", AuthController.login)
router.get("/me", authMiddleware, getMe)

export default router