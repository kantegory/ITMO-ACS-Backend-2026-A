import express from "express";
import cors from "cors";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { env } from "./config/env";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.allowedOrigins,
      credentials: true,
    }),
  );

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

  const openapiPath =
    process.env.OPENAPI_PATH ||
    path.join(process.cwd(), "..", "..", "api", "openapi.yaml");
  const openapiDoc = YAML.load(openapiPath);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

  const proxyTo = (target: string, apiPrefix: string) =>
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path) => `${apiPrefix}${path}`,
    });

  app.use("/api/v1/auth", proxyTo(env.authServiceUrl, "/api/v1/auth"));
  app.get(
    "/api/v1/me",
    createProxyMiddleware({
      target: env.authServiceUrl,
      changeOrigin: true,
      pathRewrite: () => "/api/v1/me",
    }),
  );
  app.use("/api/v1/me", proxyTo(env.profileServiceUrl, "/api/v1/me"));
  app.use("/api/v1/vacancies", proxyTo(env.vacancyServiceUrl, "/api/v1/vacancies"));
  app.use("/api/v1/employer", proxyTo(env.vacancyServiceUrl, "/api/v1/employer"));

  return app;
}
