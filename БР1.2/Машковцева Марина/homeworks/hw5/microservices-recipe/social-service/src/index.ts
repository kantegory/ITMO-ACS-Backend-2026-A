import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { authMiddleware } from "./middleware/auth";

// Импорты контроллеров
import { getCommentsByRecipe, addComment, deleteComment } from "./controllers/commentController";
import { getLikesCount, addLike, removeLike } from "./controllers/likeController";
import { getSavedRecipes, saveRecipe, unsaveRecipe } from "./controllers/savedController";
import { getSubscriptions, subscribe, unsubscribe } from "./controllers/subscriptionController";
import { getRecipeStats } from "./controllers/internalController";
import { consumeUserEvents } from './rabbitmq/consumer';

dotenv.config();
const app = express();
app.use(express.json());

// Внутренние эндпоинты (для других сервисов)
app.get("/internal/recipes/:id/stats", getRecipeStats);

// Публичные эндпоинты (не требуют токена)
app.get("/comments/recipe/:recipeId", getCommentsByRecipe);
app.get("/likes/recipe/:recipeId", getLikesCount);

// Защищённые эндпоинты (требуют JWT)
app.use("/comments", authMiddleware);
app.use("/likes", authMiddleware);
app.use("/saved", authMiddleware);
app.use("/subscriptions", authMiddleware);

// Комментарии
app.post("/comments/recipe/:recipeId", addComment);
app.delete("/comments/:commentId", deleteComment);

// Лайки
app.post("/likes/recipe/:recipeId", addLike);
app.delete("/likes/recipe/:recipeId", removeLike);

// Сохранённые рецепты
app.get("/saved/me", getSavedRecipes);
app.post("/saved/recipe/:recipeId", saveRecipe);
app.delete("/saved/recipe/:recipeId", unsaveRecipe);

// Подписки
app.get("/subscriptions/me", getSubscriptions);
app.post("/subscriptions/user/:userId", subscribe);
app.delete("/subscriptions/user/:userId", unsubscribe);

AppDataSource.initialize().then(() => {
    const port = process.env.PORT || 3003;
    app.listen(port, () => {
        console.log(`Social Service running on port ${port}`);
        console.log(`  GET  /internal/recipes/:id/stats - internal stats`);
        console.log(`  GET  /comments/recipe/:recipeId - get comments`);
        console.log(`  POST /comments/recipe/:recipeId - add comment (auth required)`);
        console.log(`  POST /likes/recipe/:recipeId - add like (auth required)`);
        console.log(`  POST /saved/recipe/:recipeId - save recipe (auth required)`);
        console.log(`  POST /subscriptions/user/:userId - subscribe (auth required)`);
        consumeUserEvents().catch(err => console.error("Failed to start RabbitMQ consumer", err));
    });
}).catch(err => {
    console.error("Database connection error:", err);
});
