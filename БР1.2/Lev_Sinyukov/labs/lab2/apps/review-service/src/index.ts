import express from "express";
import dotenv from "dotenv";
import { buildHealth } from "@app/shared";
import { AppDataSource } from "./data-source";

dotenv.config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 8084);
const serviceName = process.env.SERVICE_NAME ?? "review-service";

app.get("/health", (_req, res) => {
  res.json(buildHealth(serviceName));
});

app.get("/internal/reviews/restaurant/:restaurantId/summary", (req, res) => {
  const restaurantId = Number(req.params.restaurantId);

  res.json({
    restaurant_id: restaurantId,
    average_rating: 4.5,
    reviews_count: 12,
  });
});

app.listen(port, async () => {
  try {
    await AppDataSource.initialize();
    console.log(`[${serviceName}] DB connection initialized`);
  } catch (error) {
    console.warn(`[${serviceName}] DB connection skipped:`, error);
  }

  console.log(`[${serviceName}] listening on port ${port}`);
});