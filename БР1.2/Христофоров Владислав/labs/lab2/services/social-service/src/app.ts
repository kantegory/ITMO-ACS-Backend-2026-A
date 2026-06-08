import "reflect-metadata";
import express from "express";
import cors from "cors";
import { useExpressServer } from "routing-controllers";
import dataSource from "./config/data-source";

import { InternalSocialController } from "./controllers/internal.controller";
import { BlogController } from "./controllers/blog-post.controller";
import { SocialRecipeController } from "./controllers/social-recipe.controller";
import { SocialUserController } from "./controllers/social-user.controller";
import { AdminController } from "./controllers/admin.controller";
import { CommentController } from "./controllers/comment.controller";

const app = express();
const PORT = process.env.APP_PORT || 8003;

app.use(cors());

useExpressServer(app, {
    routePrefix: process.env.APP_API_PREFIX || "/api/v1",
    controllers: [BlogController, SocialRecipeController, SocialUserController, AdminController, CommentController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

useExpressServer(app, {
    routePrefix: "",
    controllers: [InternalSocialController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

const start = async () => {
    try {
        await dataSource.initialize();
        console.log("✅ Social Database connected!");
        app.listen(PORT, () => {
            console.log(
                `🚀 Social Service is running on http://localhost:${PORT}`,
            );
        });
    } catch (err) {
        console.error("Database connection error:", err);
    }
};

start();
