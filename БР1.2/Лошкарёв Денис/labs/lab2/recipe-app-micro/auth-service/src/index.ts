import "reflect-metadata";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { AppDataSource } from "./config/db";
import authRoutes from "./routes/auth";
import internalRoutes from "./routes/internal";

const app = express();
app.use(cors());
app.use(express.json());

// Маршруты
app.use("/auth", authRoutes);
app.use("/internal", internalRoutes);

// Swagger
const swaggerPath = path.join(process.cwd(), 'swagger-output.json');
if (fs.existsSync(swaggerPath)) {
    const swaggerFile = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

app.get('/api-docs-json', (req, res) => {
    const swaggerPath = path.join(process.cwd(), 'swagger-output.json');
    if (fs.existsSync(swaggerPath)) {
        res.sendFile(swaggerPath);
    } else {
        res.status(404).json({ error: "Swagger file not found" });
    }
});

const PORT = process.env.PORT || 3001;

const start = async () => {
    try {
        await AppDataSource.initialize();
        console.log("✅ Auth DB Connected");
        app.listen(PORT, () => console.log(`🚀 Auth Service: http://localhost:${PORT}`));
    } catch (error) {
        console.log("❌ DB Error, retrying...", error);
        setTimeout(start, 5000);
    }
};

start();