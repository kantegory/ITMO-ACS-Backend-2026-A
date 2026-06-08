import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import { useExpressServer } from "routing-controllers";
import { MediaController } from "./controllers/media.controller";

const app = express();
const PORT = process.env.APP_PORT || 8004;

app.use(cors());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

useExpressServer(app, {
    routePrefix: process.env.APP_API_PREFIX || "/api/v1",
    controllers: [MediaController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

app.listen(PORT, () => {
    console.log(`🚀 Media Service is running on http://localhost:${PORT}`);
});
