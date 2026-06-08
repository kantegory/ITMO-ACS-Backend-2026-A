import { Router } from "express";
import { RecipeController } from "../controllers/RecipeController";
import { authMidla } from "../midla/auth";

const router = Router();

router.get("/", (req, res) => {
    // #swagger.tags = ['Recipes']
    RecipeController.getAll(req, res);
});

router.get("/search", (req, res) => {
    // #swagger.tags = ['Recipes']
    RecipeController.search(req, res);
});

router.post("/", authMidla, (req, res) => {
    // #swagger.tags = ['Recipes']
    // #swagger.security = [{ "bearerAuth": [] }]
    RecipeController.create(req as any, res);
});

router.get("/:id", (req, res) => {
    // #swagger.tags = ['Recipes']
    RecipeController.getOne(req, res);
});

router.put("/:id", authMidla, (req, res) => {
    // #swagger.tags = ['Recipes']
    // #swagger.security = [{ "bearerAuth": [] }]
    RecipeController.update(req as any, res);
});

router.delete("/:id", authMidla, (req, res) => {
    // #swagger.tags = ['Recipes']
    // #swagger.security = [{ "bearerAuth": [] }]
    RecipeController.delete(req as any, res);
});

// Социальные функции
router.post("/:id/like", authMidla, (req, res) => {
    // #swagger.tags = ['Social']
    // #swagger.security = [{ "bearerAuth": [] }]
    res.json({ message: "Liked" });
});

router.post("/:id/comments", authMidla, (req, res) => {
    // #swagger.tags = ['Social']
    // #swagger.security = [{ "bearerAuth": [] }]
    res.json({ message: "Commented" });
});

export default router;