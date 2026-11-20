import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { authMiddleware } from "./middleware/auth";
import { register, login, getProfile, updateProfile } from "./controllers/authController";
import { getUserById } from "./controllers/internalController";
import { connectRabbitMQ } from './rabbitmq/producer';

dotenv.config();
const app = express();
app.use(express.json());

// Публичные маршруты
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

// Внутренний маршрут для других сервисов
app.get("/internal/users/:id", getUserById);

// Защищённые маршруты
app.get("/api/auth/me", authMiddleware, getProfile);
app.put("/api/auth/me", authMiddleware, updateProfile);

AppDataSource.initialize()
    .then(async () => { 
        console.log("User Service connected to database");
        
        await connectRabbitMQ();
        
        const port = process.env.PORT || 3001;
        app.listen(port, () => {
            console.log(`User Service running on port ${port}`);
        });
    })
    .catch(err => {
        console.error("Database connection error:", err);
    });
