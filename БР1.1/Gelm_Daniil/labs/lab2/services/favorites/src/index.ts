import "dotenv/config";
import express from "express";
import { authRequired } from "../../../shared/auth.js";
import { createApp, listen } from "../../../shared/create-app.js";
import { serviceTokenRequired } from "../../../shared/service-auth.js";
import { AppDataSource } from "./data-source.js";

const app = createApp();
const api = express.Router();
const internal = express.Router();

api.post("/vacancies/:vacancyId/favorite", authRequired, async (req, res) => {
  const vacancyId = Number(req.params.vacancyId);
  const repo = AppDataSource.getRepository("FavoriteVacancy");
  if (await repo.findOne({ where: { userId: req.auth!.userId, vacancyId } })) {
    return res.status(409).json({ code: "CONFLICT", message: "Уже в избранном" });
  }
  await repo.save(repo.create({ userId: req.auth!.userId, vacancyId }));
  return res.status(201).json({ ok: true });
});

api.delete("/vacancies/:vacancyId/favorite", authRequired, async (req, res) => {
  const vacancyId = Number(req.params.vacancyId);
  await AppDataSource.getRepository("FavoriteVacancy").delete({ userId: req.auth!.userId, vacancyId });
  return res.status(204).send();
});

internal.use(serviceTokenRequired);
internal.get("/favorites", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(422).json({ code: "VALIDATION_ERROR", message: "Некорректный userId" });
  }
  const records = await AppDataSource.getRepository("FavoriteVacancy").find({ where: { userId } });
  return res.json({ vacancyIds: records.map((r) => r.vacancyId) });
});

app.use("/api/v1", api);
app.use("/internal", internal);

AppDataSource.initialize()
  .then(() => listen(app, 3007, "Favorites Service"))
  .catch((e) => { console.error(e); process.exit(1); });
