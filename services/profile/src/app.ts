import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "profile" }));

  app.use("/api/v1", routes);
  app.use(errorHandler);

  return app;
}
