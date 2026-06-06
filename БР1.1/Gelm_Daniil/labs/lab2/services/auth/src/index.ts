import "dotenv/config";
import bcrypt from "bcryptjs";
import express from "express";
import { z } from "zod";
import { authRequired, signToken } from "../../../shared/auth.js";
import { createApp, listen } from "../../../shared/create-app.js";
import { serviceTokenRequired } from "../../../shared/service-auth.js";
import { parseBody } from "../../../shared/validation.js";
import type { UserRole } from "../../../shared/types.js";
import { AppDataSource } from "./data-source.js";
import { toPublicUser } from "./entities.js";

const app = createApp();
const api = express.Router();
const internal = express.Router();

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

api.post("/auth/register", async (req, res) => {
  const body = parseBody(registerSchema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const users = AppDataSource.getRepository("User");
  if (await users.findOne({ where: { email: body.email } })) {
    return res.status(409).json({ code: "CONFLICT", message: "Email уже занят" });
  }

  const saved = await users.save(users.create({
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 10),
    firstName: body.firstName,
    lastName: body.lastName,
    role: body.role as UserRole,
  }));

  return res.status(201).json({ accessToken: signToken({ userId: saved.id, role: saved.role as UserRole }), user: saved });
});

api.post("/auth/login", async (req, res) => {
  const body = parseBody(loginSchema, req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const users = AppDataSource.getRepository("User");
  const user = await users.findOne({ where: { email: body.email } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Неверные учетные данные" });
  }

  return res.json({ accessToken: signToken({ userId: user.id, role: user.role as UserRole }), user });
});

api.get("/users/me", authRequired, async (req, res) => {
  const user = await AppDataSource.getRepository("User").findOne({ where: { id: req.auth!.userId } });
  return res.json(user);
});

internal.use(serviceTokenRequired);
internal.get("/users/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const user = await AppDataSource.getRepository("User").findOne({ where: { id: userId } });
  if (!user) return res.status(404).json({ code: "NOT_FOUND", message: "Пользователь не найден" });
  return res.json(toPublicUser(user));
});

internal.get("/users/:userId/exists", async (req, res) => {
  const userId = Number(req.params.userId);
  const user = await AppDataSource.getRepository("User").findOne({ where: { id: userId } });
  return res.json({ exists: Boolean(user) });
});

app.use("/api/v1", api);
app.use("/internal", internal);

AppDataSource.initialize()
  .then(() => listen(app, 3001, "Auth Service"))
  .catch((e) => { console.error(e); process.exit(1); });
