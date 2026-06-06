import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import internalRoutes from "./routes/internal";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth" }));

  app.use("/api/v1", routes);
  app.use("/internal", internalRoutes);
  app.use(errorHandler);

  return app;
}
