import express from "express";
import dotenv from "dotenv";
import { buildHealth, buildError } from "@app/shared";

dotenv.config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 8080);
const serviceName = process.env.SERVICE_NAME ?? "api-gateway";
const catalogServiceUrl = process.env.CATALOG_SERVICE_URL ?? "http://localhost:8082";

app.get("/health", (_req, res) => {
  res.json(buildHealth(serviceName));
});

app.get("/api/v1/info", (_req, res) => {
  res.json({
    service: serviceName,
    description: "BFF/API Gateway для маршрутизации клиентских запросов в микросервисы",
  });
});

app.get("/api/v1/restaurants", async (req, res) => {
  try {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string" && value.length > 0) {
        query.set(key, value);
      }
    }

    const response = await fetch(`${catalogServiceUrl}/internal/restaurants?${query.toString()}`);
    const payload = await response.json();

    return res.status(response.status).json(payload);
  } catch (error) {
    console.error("Catalog proxy error:", error);
    return res.status(503).json(buildError("SERVICE_UNAVAILABLE", "Сервис каталога недоступен"));
  }
});

app.use((_req, res) => {
  res.status(404).json(buildError("NOT_FOUND", "Маршрут не найден"));
});

app.listen(port, () => {
  console.log(`[${serviceName}] listening on port ${port}`);
});
