import express from "express";
import dotenv from "dotenv";
import { buildHealth, buildError } from "@app/shared";
import { AppDataSource } from "./data-source";

dotenv.config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 8083);
const serviceName = process.env.SERVICE_NAME ?? "reservation-service";

app.get("/health", (_req, res) => {
  res.json(buildHealth(serviceName));
});

app.post("/internal/reservations/availability/check", (req, res) => {
  const { restaurant_id, table_id, reservation_start, reservation_end, guests_count } = req.body ?? {};

  if (!restaurant_id || !table_id || !reservation_start || !reservation_end || !guests_count) {
    return res.status(400).json(buildError("VALIDATION_ERROR", "Не все обязательные поля переданы"));
  }

  if (Number(guests_count) > 8) {
    return res.status(422).json(buildError("CAPACITY_EXCEEDED", "Количество гостей превышает вместимость"));
  }

  return res.json({
    available: true,
    reason: "OK",
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