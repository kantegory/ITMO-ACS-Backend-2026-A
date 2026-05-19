import "dotenv/config";
import express from "express";
import cors from "cors";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const port = parseInt(process.env.PORT || "8080", 10);
const identityUrl = process.env.IDENTITY_SERVICE_URL || "http://localhost:3001";
const propertyUrl = process.env.PROPERTY_SERVICE_URL || "http://localhost:3002";
const rentalUrl = process.env.RENTAL_SERVICE_URL || "http://localhost:3003";
const messagingUrl = process.env.MESSAGING_SERVICE_URL || "http://localhost:3004";

const proxyDefaults: Partial<Options> = {
  changeOrigin: true,
  xfwd: true,
  // Внутренние пути сервисов скрыты от внешнего мира.
  pathFilter: (path) => !path.startsWith("/api/v1/internal/"),
};

const route = (target: string, paths: string[] | ((path: string) => boolean)) =>
  createProxyMiddleware({
    ...proxyDefaults,
    target,
    pathFilter: typeof paths === "function" ? paths : paths,
  });

const app = express();
app.use(cors());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "api-gateway" }));

// Порядок важен: более специфичные маршруты раньше общих.
// /users/me/properties → property-service
app.use(route(propertyUrl, (path) => path.startsWith("/api/v1/users/me/properties")));
// /users/me/rentals → rental-service
app.use(route(rentalUrl, (path) => path.startsWith("/api/v1/users/me/rentals")));
// /auth/* и /users/me → identity-service
app.use(
  route(
    identityUrl,
    (path) => path.startsWith("/api/v1/auth/") || path.startsWith("/api/v1/users/")
  )
);
// /rentals/:id/messages → messaging-service
app.use(
  route(messagingUrl, (path) => /^\/api\/v1\/rentals\/[^/]+\/messages(\/.*)?$/.test(path))
);
// /properties/:id/rentals → rental-service (POST для создания сделки)
app.use(
  route(rentalUrl, (path) => /^\/api\/v1\/properties\/[^/]+\/rentals\/?$/.test(path))
);
// /rentals/* → rental-service
app.use(route(rentalUrl, (path) => path.startsWith("/api/v1/rentals")));
// /properties/*, /property-types, /amenities → property-service
app.use(
  route(
    propertyUrl,
    (path) =>
      path.startsWith("/api/v1/properties") ||
      path.startsWith("/api/v1/property-types") ||
      path.startsWith("/api/v1/amenities")
  )
);

app.use((_req, res) => res.status(404).json({ error: "not_found", message: "Маршрут не найден" }));

app.listen(port, () => {
  console.log(`API Gateway listening on http://localhost:${port}`);
  console.log(`  → identity:  ${identityUrl}`);
  console.log(`  → property:  ${propertyUrl}`);
  console.log(`  → rental:    ${rentalUrl}`);
  console.log(`  → messaging: ${messagingUrl}`);
});
