import { asyncHandler } from "../shared/async-handler";
import { port, serviceUrl } from "../shared/config";
import { notFound } from "../shared/errors";
import { upstream } from "../shared/http";
import { createApp, finishApp, serve } from "../shared/server";
import { messagingEnabled } from "../messaging/rabbit";

const app = createApp("gateway");
const destinations = { auth: "ACCOUNTS", users: "ACCOUNTS", restaurants: "CATALOG", cuisines: "CATALOG", reservations: "BOOKINGS", notifications: "NOTIFICATIONS" } as const;

app.get("/ready", asyncHandler(async (_req, res) => {
  const names: Parameters<typeof serviceUrl>[0][] = ["ACCOUNTS", "CATALOG", "BOOKINGS", ...(messagingEnabled() ? ["NOTIFICATIONS" as const] : [])];
  const statuses = await Promise.all(names.map(async name => {
    const check = messagingEnabled() && ["BOOKINGS", "NOTIFICATIONS"].includes(name) ? "/ready" : "/health";
    try { const response = await upstream(`${serviceUrl(name)}${check}`); return [name.toLowerCase(), response.status === 200 ? "ok" : "unavailable"]; }
    catch { return [name.toLowerCase(), "unavailable"]; }
  }));
  const healthy = statuses.every(([, status]) => status === "ok");
  res.status(healthy ? 200 : 503).json({ status: healthy ? "ok" : "degraded", services: Object.fromEntries(statuses) });
}));

app.use(asyncHandler(async (req, res) => {
  const prefix = req.path.split("/")[1] as keyof typeof destinations;
  if (!Object.hasOwn(destinations, prefix)) throw notFound("Маршрут не найден.");
  if (prefix === "notifications" && !messagingEnabled()) throw notFound();
  const url = new URL(serviceUrl(destinations[prefix]) + req.originalUrl);
  if (url.pathname.split("/")[1] !== prefix) throw notFound();
  const authorization = req.header("authorization");
  const response = await upstream(url.toString(), {
    method: req.method,
    headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) },
    ...(!["GET", "HEAD"].includes(req.method) ? { body: JSON.stringify(req.body) } : {}),
  }, 6500);
  res.status(response.status).json(response.body);
}));
finishApp(app);
serve(app, port("GATEWAY_PORT", 8080), "gateway");
