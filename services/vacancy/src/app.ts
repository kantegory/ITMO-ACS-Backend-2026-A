import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import internalRoutes from "./routes/internal";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "vacancy" }));

  app.use("/api/v1", routes);
  app.use("/internal", internalRoutes);
  app.use(errorHandler);

  return app;
}
