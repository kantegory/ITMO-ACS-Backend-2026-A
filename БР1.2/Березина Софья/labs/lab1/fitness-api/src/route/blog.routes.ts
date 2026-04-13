import { Router } from "express";
import { BlogController } from "../controller/BlogController";

const router = Router();

router.get("/posts", BlogController.getPosts);
router.get("/posts/:id", BlogController.getPostById);

export default router;
