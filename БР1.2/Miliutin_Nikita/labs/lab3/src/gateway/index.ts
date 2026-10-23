import cors from "cors";
import express, { Request, Response } from "express";
import { error, ok, parseJsonResponse } from "../common/http";

const app = express();
const PORT = Number(process.env.PORT) || 3003;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth:4001";
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://restaurants:4002";
const TABLE_SERVICE_URL = process.env.TABLE_SERVICE_URL || "http://tables:4003";
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || "http://reservations:4004";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notifications:4005";

app.use(cors());
app.use(express.json());

const proxyJson = async (res: Response, response: globalThis.Response): Promise<Response> =>
  res.status(response.status).json(await parseJsonResponse<unknown>(response));

app.get("/", (_req: Request, res: Response) => ok(res, { message: "Containerized Restaurant Booking API Gateway is running" }));

app.post("/api/auth/register", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${AUTH_SERVICE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body)
  }))
);

app.post("/api/auth/login", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body)
  }))
);

app.get("/api/users/me", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${AUTH_SERVICE_URL}/auth/me`, { headers: { Authorization: req.header("Authorization") || "" } }))
);

app.get("/api/restaurants", async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  return proxyJson(res, await fetch(`${RESTAURANT_SERVICE_URL}/restaurants?${params.toString()}`));
});

app.get("/api/restaurants/:id", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${RESTAURANT_SERVICE_URL}/restaurants/${req.params.id}`))
);

app.get("/api/restaurants/:id/tables", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${TABLE_SERVICE_URL}/restaurants/${req.params.id}/tables`))
);

app.post("/api/reservations", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${RESERVATION_SERVICE_URL}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: req.header("Authorization") || "" },
    body: JSON.stringify(req.body)
  }))
);

app.get("/api/reservations/my", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${RESERVATION_SERVICE_URL}/reservations/my`, { headers: { Authorization: req.header("Authorization") || "" } }))
);

app.delete("/api/reservations/:id", async (req: Request, res: Response) =>
  proxyJson(res, await fetch(`${RESERVATION_SERVICE_URL}/reservations/${req.params.id}`, {
    method: "DELETE",
    headers: { Authorization: req.header("Authorization") || "" }
  }))
);

app.get("/api/notifications", async (_req: Request, res: Response) =>
  proxyJson(res, await fetch(`${NOTIFICATION_SERVICE_URL}/notifications`))
);

app.use((_req: Request, res: Response) => error(res, 404, "Маршрут не найден"));

app.listen(PORT, () => console.log(`API Gateway started on ${PORT}`));
