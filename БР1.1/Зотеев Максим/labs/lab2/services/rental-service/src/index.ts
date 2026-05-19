import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { config } from "./config";
import router from "./routes";
import { errorHandler } from "./middleware/error";
import { connectRabbit } from "./messaging/publisher";

const bootstrap = async () => {
  await AppDataSource.initialize();
  await connectRabbit();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "rental" }));
  app.use("/api/v1", router);

  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Rental service listening on http://localhost:${config.port}`);
  });
};

bootstrap().catch((e) => {
  console.error("Failed to start rental-service:", e);
  process.exit(1);
});
