import "dotenv/config";
import express from "express";
import { z } from "zod";
import { authRequired, roleRequired } from "../../../shared/auth.js";
import { createApp, listen } from "../../../shared/create-app.js";
import { serviceTokenRequired } from "../../../shared/service-auth.js";
import { parseBody } from "../../../shared/validation.js";
import { AppDataSource } from "./data-source.js";

const app = createApp();
const api = express.Router();
const internal = express.Router();

api.get("/companies", async (_req, res) => {
  const companies = await AppDataSource.getRepository("Company").find();
  return res.json(companies);
});

api.post("/companies", authRequired, roleRequired(["employer", "admin"]), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    website: z.string().url().optional(),
    location: z.string().optional(),
  });
  const body = parseBody(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const repo = AppDataSource.getRepository("Company");
  const saved = await repo.save(repo.create({ ...body, ownerId: req.auth!.userId }));
  return res.status(201).json(saved);
});

internal.use(serviceTokenRequired);
internal.get("/companies/:companyId", async (req, res) => {
  const company = await AppDataSource.getRepository("Company").findOne({ where: { id: Number(req.params.companyId) } });
  if (!company) return res.status(404).json({ code: "NOT_FOUND", message: "Компания не найдена" });
  return res.json(company);
});

internal.get("/companies/:companyId/owner", async (req, res) => {
  const company = await AppDataSource.getRepository("Company").findOne({ where: { id: Number(req.params.companyId) } });
  if (!company) return res.status(404).json({ code: "NOT_FOUND", message: "Компания не найдена" });
  return res.json({ companyId: company.id, ownerId: company.ownerId });
});

app.use("/api/v1", api);
app.use("/internal", internal);

AppDataSource.initialize()
  .then(() => listen(app, 3002, "Company Service"))
  .catch((e) => { console.error(e); process.exit(1); });
