import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
const router = Router();

router.post("/register", (req, res) => {
    // #swagger.tags = ['Auth']
    AuthController.register(req, res);
});

router.post("/login", (req, res) => {
    // #swagger.tags = ['Auth']
    AuthController.login(req, res);
});

router.post("/refresh", (req, res) => {
    // #swagger.tags = ['Auth']
    AuthController.refresh(req, res);
});

export default router;