import "dotenv/config";
import express from "express";
import { z } from "zod";
import { authRequired, roleRequired } from "../../../shared/auth.js";
import { createApp, listen } from "../../../shared/create-app.js";
import { serviceGet } from "../../../shared/service-client.js";
import { parseBody } from "../../../shared/validation.js";
import type { ApplicationStatus, Resume, Vacancy } from "../../../shared/types.js";
import { AppDataSource } from "./data-source.js";

const VACANCY_URL = process.env.VACANCY_SERVICE_URL ?? "http://localhost:3005";
const RESUME_URL = process.env.RESUME_SERVICE_URL ?? "http://localhost:3004";

const app = createApp();
const api = express.Router();

api.post("/vacancies/:vacancyId/applications", authRequired, roleRequired(["applicant", "admin"]), async (req, res) => {
  const schema = z.object({
    resumeId: z.number().int().positive(),
    coverLetter: z.string().optional(),
  });
  const body = parseBody(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const vacancyId = Number(req.params.vacancyId);
  if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректный vacancyId" });
  }

  const vacancyRes = await serviceGet<Vacancy>(`${VACANCY_URL}/internal/vacancies/${vacancyId}`);
  if (!vacancyRes.ok) {
    return res.status(vacancyRes.status === 404 ? 404 : 502).json({
      code: vacancyRes.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY",
      message: vacancyRes.status === 404 ? "Вакансия не найдена" : "Vacancy Service недоступен",
    });
  }

  const resumeRes = await serviceGet<Resume>(`${RESUME_URL}/internal/resumes/${body.resumeId}`);
  if (!resumeRes.ok) {
    return res.status(resumeRes.status === 404 ? 404 : 502).json({
      code: resumeRes.status === 404 ? "NOT_FOUND" : "BAD_GATEWAY",
      message: resumeRes.status === 404 ? "Резюме не найдено" : "Resume Service недоступен",
    });
  }

  if (req.auth!.role !== "admin" && resumeRes.data.userId !== req.auth!.userId) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Недостаточно прав для отклика" });
  }

  const repo = AppDataSource.getRepository("Application");
  if (await repo.findOne({ where: { vacancyId, resumeId: body.resumeId } })) {
    return res.status(409).json({ code: "CONFLICT", message: "Отклик уже отправлен" });
  }

  const saved = await repo.save(repo.create({
    vacancyId,
    resumeId: body.resumeId,
    coverLetter: body.coverLetter,
    status: "sent" as ApplicationStatus,
  }));
  return res.status(201).json(saved);
});

api.get("/applications/my", authRequired, roleRequired(["applicant", "admin"]), async (req, res) => {
  const resumesRes = await serviceGet<Resume[]>(`${RESUME_URL}/internal/resumes/by-user/${req.auth!.userId}`);
  if (!resumesRes.ok) return res.status(502).json({ code: "BAD_GATEWAY", message: "Resume Service недоступен" });

  const ids = resumesRes.data.map((r) => r.id);
  if (!ids.length) return res.json([]);

  const applications = await AppDataSource.getRepository("Application")
    .createQueryBuilder("a")
    .where("a.resumeId IN (:...ids)", { ids })
    .getMany();
  return res.json(applications);
});

api.patch("/applications/:applicationId/status", authRequired, roleRequired(["employer", "admin"]), async (req, res) => {
  const body = parseBody(z.object({ status: z.enum(["sent", "viewed", "accepted", "rejected"]) }), req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const applicationId = Number(req.params.applicationId);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректный applicationId" });
  }

  const repo = AppDataSource.getRepository("Application");
  const application = await repo.findOne({ where: { id: applicationId } });
  if (!application) return res.status(404).json({ code: "NOT_FOUND", message: "Отклик не найден" });

  application.status = body.status as ApplicationStatus;
  return res.json(await repo.save(application));
});

app.use("/api/v1", api);

AppDataSource.initialize()
  .then(() => listen(app, 3006, "Application Service"))
  .catch((e) => { console.error(e); process.exit(1); });
