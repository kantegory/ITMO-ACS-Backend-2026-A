import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const openapiPath = path.join(process.cwd(), "api", "openapi.yaml");
  const openapiDoc = YAML.load(openapiPath);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  app.use("/api/v1", routes);
  app.use(errorHandler);

  return app;
}
