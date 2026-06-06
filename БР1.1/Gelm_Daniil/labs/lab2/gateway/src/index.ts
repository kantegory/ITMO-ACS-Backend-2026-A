import "dotenv/config";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { authRequired } from "../../shared/auth.js";
import { serviceGet, servicePost } from "../../shared/service-client.js";
import type { Vacancy } from "../../shared/types.js";

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001";
const COMPANY_URL = process.env.COMPANY_SERVICE_URL ?? "http://localhost:3002";
const SKILLS_URL = process.env.SKILLS_SERVICE_URL ?? "http://localhost:3003";
const RESUME_URL = process.env.RESUME_SERVICE_URL ?? "http://localhost:3004";
const VACANCY_URL = process.env.VACANCY_SERVICE_URL ?? "http://localhost:3005";
const APPLICATION_URL = process.env.APPLICATION_SERVICE_URL ?? "http://localhost:3006";
const FAVORITES_URL = process.env.FAVORITES_SERVICE_URL ?? "http://localhost:3007";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

async function forward(req: Request, res: Response, targetBase: string): Promise<void> {
  const url = `${targetBase}${req.originalUrl}`;
  const headers: Record<string, string> = {};
  if (req.headers.authorization) headers.Authorization = String(req.headers.authorization);
  if (req.headers["content-type"]) headers["Content-Type"] = String(req.headers["content-type"]);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
    init.body = JSON.stringify(req.body);
    headers["Content-Type"] = "application/json";
  }

  try {
    const upstream = await fetch(url, init);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key !== "transfer-encoding" && key !== "content-encoding") {
        res.setHeader(key, value);
      }
    });
    if (upstream.status === 204) {
      res.end();
      return;
    }
    const text = await upstream.text();
    res.send(text);
  } catch {
    res.status(502).json({ code: "BAD_GATEWAY", message: "Сервис недоступен" });
  }
}

app.get("/api/v1/favorites", authRequired, async (req, res) => {
  const favRes = await serviceGet<{ vacancyIds: number[] }>(
    `${FAVORITES_URL}/internal/favorites?userId=${req.auth!.userId}`,
  );
  if (!favRes.ok) return res.status(502).json({ code: "BAD_GATEWAY", message: "Favorites Service недоступен" });
  if (!favRes.data.vacancyIds.length) return res.json([]);

  const vacRes = await servicePost<Vacancy[]>(`${VACANCY_URL}/internal/vacancies/batch`, { ids: favRes.data.vacancyIds });
  if (!vacRes.ok) return res.status(502).json({ code: "BAD_GATEWAY", message: "Vacancy Service недоступен" });
  return res.json(vacRes.data);
});

app.use("/api/v1/auth", (req, res) => forward(req, res, AUTH_URL));
app.use("/api/v1/users", (req, res) => forward(req, res, AUTH_URL));
app.use("/api/v1/companies", (req, res) => forward(req, res, COMPANY_URL));
app.use("/api/v1/skills", (req, res) => forward(req, res, SKILLS_URL));
app.use("/api/v1/resumes", (req, res) => forward(req, res, RESUME_URL));
app.use("/api/v1/applications", (req, res) => forward(req, res, APPLICATION_URL));
app.use("/api/v1/vacancies/:vacancyId/applications", (req, res) => forward(req, res, APPLICATION_URL));
app.use("/api/v1/vacancies/:vacancyId/favorite", (req, res) => forward(req, res, FAVORITES_URL));
app.use("/api/v1/vacancies", (req, res) => forward(req, res, VACANCY_URL));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API Gateway http://localhost:${port}`));
