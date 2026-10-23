import cors from "cors";
import express, { Request, Response } from "express";
import { error, ok, parseJsonResponse } from "../common/http";

const app = express();
const PORT = Number(process.env.GATEWAY_PORT) || 3002;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://localhost:4002";
const TABLE_SERVICE_URL = process.env.TABLE_SERVICE_URL || "http://localhost:4003";
const RESERVATION_SERVICE_URL = process.env.RESERVATION_SERVICE_URL || "http://localhost:4004";

app.use(cors());
app.use(express.json());

const proxyJson = async (res: Response, response: globalThis.Response): Promise<Response> => {
  const body = await parseJsonResponse<unknown>(response);
  return res.status(response.status).json(body);
};

const serviceUnavailable = (res: Response, service: string): Response =>
  error(res, 503, `${service} временно недоступен`);

app.get("/", (_req: Request, res: Response) =>
  ok(res, {
    message: "Restaurant Booking Microservices API Gateway is running",
    services: ["auth", "restaurants", "tables", "reservations"]
  })
);

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    return proxyJson(res, response);
  } catch {
    return serviceUnavailable(res, "Auth Service");
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    return proxyJson(res, response);
  } catch {
    return serviceUnavailable(res, "Auth Service");
  }
});

app.get("/api/users/me", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { Authorization: req.header("Authorization") || "" }
    });
    return proxyJson(res, response);
  } catch {
    return serviceUnavailable(res, "Auth Service");
  }
});

app.get("/api/restaurants", async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  const response = await fetch(`${RESTAURANT_SERVICE_URL}/restaurants?${params.toString()}`);
  return proxyJson(res, response);
});

app.get("/api/restaurants/:id", async (req: Request, res: Response) => {
  const response = await fetch(`${RESTAURANT_SERVICE_URL}/restaurants/${req.params.id}`);
  return proxyJson(res, response);
});

app.get("/api/restaurants/:id/tables", async (req: Request, res: Response) => {
  const response = await fetch(`${TABLE_SERVICE_URL}/restaurants/${req.params.id}/tables`);
  return proxyJson(res, response);
});

app.post("/api/reservations", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${RESERVATION_SERVICE_URL}/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.header("Authorization") || ""
      },
      body: JSON.stringify(req.body)
    });
    return proxyJson(res, response);
  } catch {
    return serviceUnavailable(res, "Reservation Service");
  }
});

app.get("/api/reservations/my", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${RESERVATION_SERVICE_URL}/reservations/my`, {
      headers: { Authorization: req.header("Authorization") || "" }
    });
    return proxyJson(res, response);
  } catch {
    return serviceUnavailable(res, "Reservation Service");
  }
});

app.delete("/api/reservations/:id", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${RESERVATION_SERVICE_URL}/reservations/${req.params.id}`, {
      method: "DELETE",
      headers: { Authorization: req.header("Authorization") || "" }
    });
    return proxyJson(res, response);
  } catch {
    return serviceUnavailable(res, "Reservation Service");
  }
});

app.use((_req: Request, res: Response) => error(res, 404, "Маршрут не найден"));

app.listen(PORT, () => console.log(`API Gateway started on http://localhost:${PORT}`));
