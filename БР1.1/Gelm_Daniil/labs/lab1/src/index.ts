import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { AppDataSource } from "./data-source";
import { authRequired, roleRequired, signToken, type AuthRequest } from "./auth";
import type { ApplicationStatus, EmploymentType, UserRole } from "./types";

const app = express();
app.use(cors());
app.use(express.json());

const api = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["applicant", "employer", "admin"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function handleValidation<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

api.post("/auth/register", async (req, res) => {
  const body = handleValidation(registerSchema, req.body);
  if (!body) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });
  }

  const users = AppDataSource.getRepository("User");
  const existing = await users.findOne({ where: { email: body.email } });
  if (existing) {
    return res.status(409).json({ code: "CONFLICT", message: "Email уже занят" });
  }

  const user = users.create({
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 10),
    firstName: body.firstName,
    lastName: body.lastName,
    role: body.role as UserRole,
  });
  const saved = await users.save(user);
  const token = signToken({ userId: saved.id, role: saved.role as UserRole });

  return res.status(201).json({ accessToken: token, user: saved });
});

api.post("/auth/login", async (req, res) => {
  const body = handleValidation(loginSchema, req.body);
  if (!body) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });
  }

  const users = AppDataSource.getRepository("User");
  const user = await users.findOne({ where: { email: body.email } });
  if (!user) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Неверные учетные данные" });
  }

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Неверные учетные данные" });
  }

  const token = signToken({ userId: user.id, role: user.role as UserRole });
  return res.json({ accessToken: token, user });
});

api.get("/users/me", authRequired, async (req: AuthRequest, res) => {
  const users = AppDataSource.getRepository("User");
  const user = await users.findOne({ where: { id: req.auth!.userId } });
  return res.json(user);
});

api.get("/companies", async (_req, res) => {
  const companies = await AppDataSource.getRepository("Company").find();
  return res.json(companies);
});

api.post("/companies", authRequired, roleRequired(["employer", "admin"]), async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    website: z.string().url().optional(),
    location: z.string().optional(),
  });
  const body = handleValidation(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const repo = AppDataSource.getRepository("Company");
  const saved = await repo.save(repo.create({ ...body, ownerId: req.auth!.userId }));
  return res.status(201).json(saved);
});

api.get("/resumes", authRequired, async (req: AuthRequest, res) => {
  const resumes = await AppDataSource.getRepository("Resume").find({ where: { userId: req.auth!.userId } });
  return res.json(resumes);
});

api.post("/resumes", authRequired, roleRequired(["applicant", "admin"]), async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1),
    about: z.string().optional(),
    experienceYears: z.number().int().min(0).default(0),
    education: z.string().optional(),
    desiredSalary: z.number().int().min(0).optional(),
  });
  const body = handleValidation(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const repo = AppDataSource.getRepository("Resume");
  const saved = await repo.save(repo.create({ ...body, userId: req.auth!.userId }));
  return res.status(201).json(saved);
});

api.get("/vacancies", async (req, res) => {
  const repo = AppDataSource.getRepository("Vacancy");
  const qb = repo.createQueryBuilder("v");

  if (typeof req.query.location === "string") qb.andWhere("v.location ILIKE :location", { location: `%${req.query.location}%` });
  if (typeof req.query.salaryFrom === "string") qb.andWhere("v.salaryFrom >= :salaryFrom", { salaryFrom: Number(req.query.salaryFrom) });
  if (typeof req.query.salaryTo === "string") qb.andWhere("v.salaryTo <= :salaryTo", { salaryTo: Number(req.query.salaryTo) });
  if (typeof req.query.experienceRequired === "string") qb.andWhere("v.experienceRequired <= :experienceRequired", { experienceRequired: Number(req.query.experienceRequired) });

  const items = await qb.orderBy("v.createdAt", "DESC").getMany();
  return res.json(items);
});

api.post("/vacancies", authRequired, roleRequired(["employer", "admin"]), async (req: AuthRequest, res) => {
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
  const body = handleValidation(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const companyRepo = AppDataSource.getRepository("Company");
  const company = await companyRepo.findOne({ where: { id: body.companyId } });
  if (!company) return res.status(404).json({ code: "NOT_FOUND", message: "Компания не найдена" });

  if (req.auth?.role !== "admin" && company.ownerId !== req.auth?.userId) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Недостаточно прав" });
  }

  const vacancyRepo = AppDataSource.getRepository("Vacancy");
  const saved = await vacancyRepo.save(vacancyRepo.create({ ...body, employmentType: body.employmentType as EmploymentType }));
  return res.status(201).json(saved);
});

api.post("/vacancies/:vacancyId/applications", authRequired, roleRequired(["applicant", "admin"]), async (req: AuthRequest, res) => {
  const schema = z.object({
    resumeId: z.number().int().positive(),
    coverLetter: z.string().optional(),
  });
  const body = handleValidation(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const vacancyId = Number(req.params.vacancyId);
  if (!Number.isInteger(vacancyId) || vacancyId <= 0) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректный vacancyId" });
  }

  const vacancy = await AppDataSource.getRepository("Vacancy").findOne({ where: { id: vacancyId } });
  if (!vacancy) return res.status(404).json({ code: "NOT_FOUND", message: "Вакансия не найдена" });

  const resume = await AppDataSource.getRepository("Resume").findOne({ where: { id: body.resumeId } });
  if (!resume || (req.auth!.role !== "admin" && resume.userId !== req.auth!.userId)) {
    return res.status(403).json({ code: "FORBIDDEN", message: "Недостаточно прав для отклика" });
  }

  const appRepo = AppDataSource.getRepository("Application");
  const duplicate = await appRepo.findOne({ where: { vacancyId, resumeId: body.resumeId } });
  if (duplicate) return res.status(409).json({ code: "CONFLICT", message: "Отклик уже отправлен" });

  const saved = await appRepo.save(appRepo.create({ vacancyId, resumeId: body.resumeId, coverLetter: body.coverLetter, status: "sent" as ApplicationStatus }));
  return res.status(201).json(saved);
});

api.get("/applications/my", authRequired, roleRequired(["applicant", "admin"]), async (req: AuthRequest, res) => {
  const resumes = await AppDataSource.getRepository("Resume").find({ where: { userId: req.auth!.userId } });
  const ids = resumes.map((item) => item.id);
  if (!ids.length) return res.json([]);

  const applications = await AppDataSource.getRepository("Application")
    .createQueryBuilder("a")
    .where("a.resumeId IN (:...ids)", { ids })
    .getMany();
  return res.json(applications);
});

api.patch("/applications/:applicationId/status", authRequired, roleRequired(["employer", "admin"]), async (req: AuthRequest, res) => {
  const schema = z.object({ status: z.enum(["sent", "viewed", "accepted", "rejected"]) });
  const body = handleValidation(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const applicationId = Number(req.params.applicationId);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректный applicationId" });
  }

  const repo = AppDataSource.getRepository("Application");
  const application = await repo.findOne({ where: { id: applicationId } });
  if (!application) return res.status(404).json({ code: "NOT_FOUND", message: "Отклик не найден" });

  application.status = body.status as ApplicationStatus;
  const saved = await repo.save(application);
  return res.json(saved);
});

api.get("/favorites", authRequired, async (req: AuthRequest, res) => {
  const favoriteRepo = AppDataSource.getRepository("FavoriteVacancy");
  const records = await favoriteRepo.find({ where: { userId: req.auth!.userId } });
  const vacancyIds = records.map((item) => item.vacancyId);
  if (!vacancyIds.length) return res.json([]);

  const vacancies = await AppDataSource.getRepository("Vacancy")
    .createQueryBuilder("v")
    .where("v.id IN (:...ids)", { ids: vacancyIds })
    .getMany();
  return res.json(vacancies);
});

api.post("/vacancies/:vacancyId/favorite", authRequired, async (req: AuthRequest, res) => {
  const vacancyId = Number(req.params.vacancyId);
  const repo = AppDataSource.getRepository("FavoriteVacancy");
  const existing = await repo.findOne({ where: { userId: req.auth!.userId, vacancyId } });
  if (existing) return res.status(409).json({ code: "CONFLICT", message: "Уже в избранном" });

  await repo.save(repo.create({ userId: req.auth!.userId, vacancyId }));
  return res.status(201).json({ ok: true });
});

api.delete("/vacancies/:vacancyId/favorite", authRequired, async (req: AuthRequest, res) => {
  const vacancyId = Number(req.params.vacancyId);
  await AppDataSource.getRepository("FavoriteVacancy").delete({ userId: req.auth!.userId, vacancyId });
  return res.status(204).send();
});

api.get("/skills", async (_req, res) => {
  const skills = await AppDataSource.getRepository("Skill").find();
  return res.json(skills);
});

api.post("/skills", authRequired, roleRequired(["admin"]), async (req, res) => {
  const schema = z.object({ name: z.string().min(1) });
  const body = handleValidation(schema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const repo = AppDataSource.getRepository("Skill");
  const duplicate = await repo.findOne({ where: { name: body.name } });
  if (duplicate) return res.status(409).json({ code: "CONFLICT", message: "Навык уже существует" });

  const saved = await repo.save(repo.create({ name: body.name }));
  return res.status(201).json(saved);
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1", api);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" });
});

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start application", error);
  process.exit(1);
});
