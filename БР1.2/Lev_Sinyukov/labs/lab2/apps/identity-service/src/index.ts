import express from "express";
import dotenv from "dotenv";
import { buildHealth, buildError } from "@app/shared";
import { AppDataSource } from "./data-source";

dotenv.config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 8081);
const serviceName = process.env.SERVICE_NAME ?? "identity-service";

app.get("/health", (_req, res) => {
  res.json(buildHealth(serviceName));
});

app.get("/internal/users/:userId", (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json(buildError("VALIDATION_ERROR", "Некорректный userId"));
  }

  return res.json({
    id: userId,
    email: `user${userId}@example.com`,
    first_name: "Test",
    last_name: "User",
    phone: "+70000000000",
    is_active: true,
  });
});

app.post("/internal/auth/introspect", (req, res) => {
  const token = req.body?.token;

  if (typeof token !== "string" || token.length < 10) {
    return res.status(401).json(buildError("UNAUTHORIZED", "Невалидный или истекший токен"));
  }

  return res.json({
    active: true,
    user_id: 1,
    email: "user1@example.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
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