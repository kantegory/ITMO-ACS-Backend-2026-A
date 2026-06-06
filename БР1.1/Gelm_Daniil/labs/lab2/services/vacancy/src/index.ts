import "dotenv/config";
import express from "express";
import { z } from "zod";
import { authRequired, roleRequired } from "../../../shared/auth.js";
import { createApp, listen } from "../../../shared/create-app.js";
import { serviceGet } from "../../../shared/service-client.js";
import { serviceTokenRequired } from "../../../shared/service-auth.js";
import { parseBody } from "../../../shared/validation.js";
import type { Company, EmploymentType, Vacancy } from "../../../shared/types.js";
import { AppDataSource } from "./data-source.js";

const COMPANY_URL = process.env.COMPANY_SERVICE_URL ?? "http://localhost:3002";

const app = createApp();
const api = express.Router();
const internal = express.Router();

api.get("/vacancies", async (req, res) => {
  const qb = AppDataSource.getRepository("Vacancy").createQueryBuilder("v");
  if (typeof req.query.location === "string") qb.andWhere("v.location ILIKE :location", { location: `%${req.query.location}%` });
  if (typeof req.query.salaryFrom === "string") qb.andWhere("v.salaryFrom >= :salaryFrom", { salaryFrom: Number(req.query.salaryFrom) });
  if (typeof req.query.salaryTo === "string") qb.andWhere("v.salaryTo <= :salaryTo", { salaryTo: Number(req.query.salaryTo) });
  if (typeof req.query.experienceRequired === "string") {
    qb.andWhere("v.experienceRequired <= :experienceRequired", { experienceRequired: Number(req.query.experienceRequired) });
  }
  return res.json(await qb.orderBy("v.createdAt", "DESC").getMany());
});

api.post("/vacancies", authRequired, roleRequired(["employer", "admin"]), async (req, res) => {
  const schema = z.object({
    companyId: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string().optional(),
    salaryFrom: z.number().int().min(0).optional(),
    salaryTo: z.number().int().min(0).optional(),
    experienceRequired: z.number().int().min(0).optional(),
    employmentType: z.enum(["full_time", "part_time", "contract", "internship"]).default("full_time"),
    location: z.string().optional(),
  });
  const body = parseBody(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const companyRes = await serviceGet<Company>(`${COMPANY_URL}/internal/companies/${body.companyId}`);
  if (!companyRes.ok) {
    return res.status(companyRes.status === 404 ? 404 : 502).json({
      code: companyRes.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY",
      message: companyRes.status === 404 ? "Компания не найдена" : "Company Service недоступен",
    });
  }

  if (req.auth?.role !== "admin" && companyRes.data.ownerId !== req.auth?.userId) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Недостаточно прав" });
  }

  const repo = AppDataSource.getRepository("Vacancy");
  const saved = await repo.save(repo.create({ ...body, employmentType: body.employmentType as EmploymentType }));
  return res.status(201).json(saved);
});

internal.use(serviceTokenRequired);
internal.get("/vacancies/:vacancyId", async (req, res) => {
  const vacancy = await AppDataSource.getRepository("Vacancy").findOne({ where: { id: Number(req.params.vacancyId) } });
  if (!vacancy) return res.status(404).json({ code: "NOT_FOUND", message: "Вакансия не найдена" });
  return res.json(vacancy);
});

internal.get("/vacancies/:vacancyId/company-id", async (req, res) => {
  const vacancy = await AppDataSource.getRepository("Vacancy").findOne({ where: { id: Number(req.params.vacancyId) } });
  if (!vacancy) return res.status(404).json({ code: "NOT_FOUND", message: "Вакансия не найдена" });
  return res.json({ vacancyId: vacancy.id, companyId: vacancy.companyId });
});

internal.post("/vacancies/batch", async (req, res) => {
  const body = parseBody(z.object({ ids: z.array(z.number().int().positive()).min(1) }), req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const vacancies = await AppDataSource.getRepository("Vacancy")
    .createQueryBuilder("v")
    .where("v.id IN (:...ids)", { ids: body.ids })
    .getMany();
  return res.json(vacancies);
});

app.use("/api/v1", api);
app.use("/internal", internal);

AppDataSource.initialize()
  .then(() => listen(app, 3005, "Vacancy Service"))
  .catch((e) => { console.error(e); process.exit(1); });
