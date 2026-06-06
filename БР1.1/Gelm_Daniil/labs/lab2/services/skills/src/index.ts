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

api.get("/skills", async (_req, res) => {
  return res.json(await AppDataSource.getRepository("Skill").find());
});

api.post("/skills", authRequired, roleRequired(["admin"]), async (req, res) => {
  const body = parseBody(z.object({ name: z.string().min(1) }), req.body);
  if (!body) return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректные данные" });

  const repo = AppDataSource.getRepository("Skill");
  if (await repo.findOne({ where: { name: body.name } })) {
    return res.status(409).json({ code: "CONFLICT", message: "Навык уже существует" });
  }
  return res.status(201).json(await repo.save(repo.create({ name: body.name })));
});

internal.use(serviceTokenRequired);
internal.get("/skills/:skillId", async (req, res) => {
  const skill = await AppDataSource.getRepository("Skill").findOne({ where: { id: Number(req.params.skillId) } });
  if (!skill) return res.status(404).json({ code: "NOT_FOUND", message: "Навык не найден" });
  return res.json(skill);
});

app.use("/api/v1", api);
app.use("/internal", internal);

AppDataSource.initialize()
  .then(() => listen(app, 3003, "Skills Service"))
  .catch((e) => { console.error(e); process.exit(1); });
