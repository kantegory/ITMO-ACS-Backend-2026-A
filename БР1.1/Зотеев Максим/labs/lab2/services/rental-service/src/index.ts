import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { config } from "./config";
import router from "./routes";
import { errorHandler, initSentry, reportFatal } from "@rental/shared";
import { connectRabbit } from "./messaging/publisher";

initSentry("rental");

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

bootstrap().catch(async (e) => {
  console.error("Failed to start rental-service:", e);
  await reportFatal(e);
  process.exit(1);
});
