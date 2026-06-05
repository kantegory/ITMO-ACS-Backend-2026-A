import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { config } from "./config";
import router from "./routes";
import { errorHandler } from "@rental/shared";
import { connectRabbit } from "./messaging/consumer";

const bootstrap = async () => {
  await AppDataSource.initialize();
  await connectRabbit();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "messaging" }));
  app.use("/api/v1", router);

  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Messaging service listening on http://localhost:${config.port}`);
  });
};

bootstrap().catch((e) => {
  console.error("Failed to start messaging-service:", e);
  process.exit(1);
});
