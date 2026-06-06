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

api.get("/resumes", authRequired, async (req, res) => {
  const resumes = await AppDataSource.getRepository("Resume").find({ where: { userId: req.auth!.userId } });
  return res.json(resumes);
});

api.post("/resumes", authRequired, roleRequired(["applicant", "admin"]), async (req, res) => {
  const schema = z.object({
    title: z.string().min(1),
    about: z.string().optional(),
    experienceYears: z.number().int().min(0).default(0),
    education: z.string().optional(),
    desiredSalary: z.number().int().min(0).optional(),
  });
  const body = parseBody(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const repo = AppDataSource.getRepository("Resume");
  const saved = await repo.save(repo.create({ ...body, userId: req.auth!.userId }));
  return res.status(201).json(saved);
});

internal.use(serviceTokenRequired);
internal.get("/resumes/:resumeId", async (req, res) => {
  const resume = await AppDataSource.getRepository("Resume").findOne({ where: { id: Number(req.params.resumeId) } });
  if (!resume) return res.status(404).json({ code: "NOT_FOUND", message: "Резюме не найдено" });
  return res.json(resume);
});

internal.get("/resumes/by-user/:userId", async (req, res) => {
  const resumes = await AppDataSource.getRepository("Resume").find({ where: { userId: Number(req.params.userId) } });
  return res.json(resumes);
});

internal.get("/resumes/:resumeId/owner", async (req, res) => {
  const resume = await AppDataSource.getRepository("Resume").findOne({ where: { id: Number(req.params.resumeId) } });
  if (!resume) return res.status(404).json({ code: "NOT_FOUND", message: "Резюме не найдено" });
  return res.json({ resumeId: resume.id, userId: resume.userId });
});

app.use("/api/v1", api);
app.use("/internal", internal);

AppDataSource.initialize()
  .then(() => listen(app, 3004, "Resume Service"))
  .catch((e) => { console.error(e); process.exit(1); });
