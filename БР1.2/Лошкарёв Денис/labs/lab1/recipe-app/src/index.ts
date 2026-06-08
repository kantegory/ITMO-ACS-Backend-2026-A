import "reflect-metadata";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { AppDataSource } from "./config/db";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import recipeRoutes from "./routes/recipes";
import userRoutes from "./routes/users";
import * as path from 'path';
import fs from 'fs'

dotenv.config();

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/recipes", recipeRoutes);
app.use("/", userRoutes);

const swaggerPath = path.join(process.cwd(), 'swagger-output.json');

if (fs.existsSync(swaggerPath)) {
    const swaggerFile = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
} else {
    console.warn("⚠️ Swagger file not found at:", swaggerPath);
}

// Запуск с проверкой БД
const start = async () => {
    try {
        await AppDataSource.initialize();
        console.log("✅ Database connected");
        app.listen(3000, () => console.log("🚀 Server: http://localhost:3000"));
    } catch (error) {
        console.log("❌ DB Error, retrying...", error);
        setTimeout(start, 5000);
    }
};

start();