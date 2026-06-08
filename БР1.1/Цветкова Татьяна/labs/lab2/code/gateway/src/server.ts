import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import { verifyToken, JwtPayload } from "@fitness/shared";

const PORT = Number(process.env.PORT ?? 3000);
const JWT_SECRET = process.env.JWT_SECRET ?? "super_secret_change_me";
const AUTH = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001";
const CATALOG = process.env.CATALOG_SERVICE_URL ?? "http://localhost:3003";
const PLAN = process.env.PLAN_SERVICE_URL ?? "http://localhost:3004";

const app = express();
app.use(cors());
app.use(morgan("dev"));

// Health
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "gateway" }),
);

/**
 * JWT-middleware. Если токен валиден — кладёт пользователя в заголовки
 * X-User-Id / X-User-Role / X-User-Email и пропускает дальше.
 * Если токена нет — пропускает (downstream сам решит, нужен ли он).
 */
const attachUser = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(h.slice("Bearer ".length), JWT_SECRET) as JwtPayload;
      req.headers["x-user-id"] = payload.sub;
      req.headers["x-user-role"] = payload.role;
      req.headers["x-user-email"] = payload.email;
    } catch {
      /* токен есть, но невалидный — пропускаем; downstream вернёт 401, если требуется auth */
    }
  }
  next();
};
app.use(attachUser);

// Маршрутизация: каждый префикс — на свой сервис.
// pathRewrite возвращает префикс, т.к. http-proxy-middleware v3 срезает mount path.
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
  }),
);
app.use(
  "/api/workouts",
  createProxyMiddleware({
    target: CATALOG,
    changeOrigin: true,
    pathRewrite: (path) => `/workouts${path}`,
  }),
);
app.use(
  "/api/workout-plans",
  createProxyMiddleware({
    target: PLAN,
    changeOrigin: true,
    pathRewrite: (path) => `/workout-plans${path}`,
  }),
);

app.use((_req, res) => res.status(404).json({ error: "Endpoint not found in gateway" }));

app.listen(PORT, () => {
  console.log(`[gateway] listening on http://localhost:${PORT}`);
  console.log(`  → /api/auth/*           ${AUTH}`);
  console.log(`  → /api/workouts/*       ${CATALOG}`);
  console.log(`  → /api/workout-plans/*  ${PLAN}`);
});
