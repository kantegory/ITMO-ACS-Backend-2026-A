import express from "express";
import { In } from "typeorm";
import { z } from "zod";
import { adminRequired, asyncHandler, authRequired, errorHandler, health, HttpError, notFound, validate } from "@fitflow/shared";
import { dataSource } from "./data-source.js";
import { PlanWorkout, TrainingPlan, Workout } from "./entities.js";

const uuid = z.string().uuid();
const workoutBody = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["cardio", "strength", "mobility"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  durationMinutes: z.number().int().min(1).max(600),
  description: z.string().trim().min(1).max(5000),
  videoUrl: z.string().url().max(2000).nullable().optional(),
});
const planBody = z.object({ name: z.string().trim().min(2).max(120), workoutIds: z.array(uuid).max(100).default([]) });

async function fullPlan(plan: TrainingPlan) {
  const links = await dataSource.getRepository(PlanWorkout).find({ where: { planId: plan.id }, order: { position: "ASC" } });
  const workouts = links.length ? await dataSource.getRepository(Workout).findBy({ id: In(links.map((x) => x.workoutId)) }) : [];
  const byId = new Map(workouts.map((x) => [x.id, x]));
  return { ...plan, workouts: links.map((x) => byId.get(x.workoutId)).filter(Boolean) };
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));
  app.get("/health", (_req, res) => res.json(health("workout")));

  app.get("/workouts", asyncHandler(async (req, res) => {
    const query = validate(z.object({
      type: z.enum(["cardio", "strength", "mobility"]).optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }), req.query);
    const [items, total] = await dataSource.getRepository(Workout).findAndCount({
      where: { ...(query.type ? { type: query.type } : {}), ...(query.level ? { level: query.level } : {}) },
      order: { createdAt: "DESC" }, skip: (query.page - 1) * query.limit, take: query.limit,
    });
    res.json({ items, page: query.page, limit: query.limit, total });
  }));
  app.get("/workouts/:id", asyncHandler(async (req, res) => {
    const workout = await dataSource.getRepository(Workout).findOneBy({ id: validate(uuid, req.params.id) });
    if (!workout) throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
    res.json(workout);
  }));
  app.post("/workouts", authRequired, adminRequired, asyncHandler(async (req, res) => {
    const workout = dataSource.getRepository(Workout).create(validate(workoutBody, req.body));
    await dataSource.getRepository(Workout).save(workout);
    res.status(201).json(workout);
  }));
  app.patch("/workouts/:id", authRequired, adminRequired, asyncHandler(async (req, res) => {
    const repo = dataSource.getRepository(Workout);
    const workout = await repo.findOneBy({ id: validate(uuid, req.params.id) });
    if (!workout) throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
    repo.merge(workout, validate(workoutBody.partial(), req.body));
    res.json(await repo.save(workout));
  }));
  app.delete("/workouts/:id", authRequired, adminRequired, asyncHandler(async (req, res) => {
    const result = await dataSource.getRepository(Workout).delete(validate(uuid, req.params.id));
    if (!result.affected) throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
    res.status(204).end();
  }));

  app.get("/plans", authRequired, asyncHandler(async (req, res) => {
    const plans = await dataSource.getRepository(TrainingPlan).find({ where: { userId: req.auth!.sub }, order: { createdAt: "DESC" } });
    res.json(await Promise.all(plans.map(fullPlan)));
  }));
  app.get("/plans/:id", authRequired, asyncHandler(async (req, res) => {
    const plan = await dataSource.getRepository(TrainingPlan).findOneBy({ id: validate(uuid, req.params.id), userId: req.auth!.sub });
    if (!plan) throw new HttpError(404, "Training plan was not found", "PLAN_NOT_FOUND");
    res.json(await fullPlan(plan));
  }));
  app.post("/plans", authRequired, asyncHandler(async (req, res) => {
    const body = validate(planBody, req.body);
    const workoutRepo = dataSource.getRepository(Workout);
    const uniqueIds = [...new Set(body.workoutIds)];
    if (uniqueIds.length && await workoutRepo.countBy({ id: In(uniqueIds) }) !== uniqueIds.length) throw new HttpError(400, "One or more workouts do not exist", "INVALID_WORKOUTS");
    const plan = await dataSource.transaction(async (manager) => {
      const saved = await manager.save(manager.create(TrainingPlan, { userId: req.auth!.sub, name: body.name }));
      await manager.save(uniqueIds.map((workoutId, position) => manager.create(PlanWorkout, { planId: saved.id, workoutId, position })));
      return saved;
    });
    res.status(201).json(await fullPlan(plan));
  }));
  app.patch("/plans/:id", authRequired, asyncHandler(async (req, res) => {
    const id = validate(uuid, req.params.id);
    const plan = await dataSource.getRepository(TrainingPlan).findOneBy({ id, userId: req.auth!.sub });
    if (!plan) throw new HttpError(404, "Training plan was not found", "PLAN_NOT_FOUND");
    plan.name = validate(z.object({ name: z.string().trim().min(2).max(120) }), req.body).name;
    await dataSource.getRepository(TrainingPlan).save(plan);
    res.json(await fullPlan(plan));
  }));
  app.put("/plans/:id/workouts", authRequired, asyncHandler(async (req, res) => {
    const id = validate(uuid, req.params.id);
    const workoutIds = [...new Set(validate(z.object({ workoutIds: z.array(uuid).max(100) }), req.body).workoutIds)];
    const plan = await dataSource.getRepository(TrainingPlan).findOneBy({ id, userId: req.auth!.sub });
    if (!plan) throw new HttpError(404, "Training plan was not found", "PLAN_NOT_FOUND");
    if (workoutIds.length && await dataSource.getRepository(Workout).countBy({ id: In(workoutIds) }) !== workoutIds.length) {
      throw new HttpError(400, "One or more workouts do not exist", "INVALID_WORKOUTS");
    }
    await dataSource.transaction(async (manager) => {
      await manager.delete(PlanWorkout, { planId: plan.id });
      await manager.save(workoutIds.map((workoutId, position) => manager.create(PlanWorkout, { planId: plan.id, workoutId, position })));
    });
    res.json(await fullPlan(plan));
  }));
  app.delete("/plans/:id", authRequired, asyncHandler(async (req, res) => {
    const id = validate(uuid, req.params.id);
    const plan = await dataSource.getRepository(TrainingPlan).findOneBy({ id, userId: req.auth!.sub });
    if (!plan) throw new HttpError(404, "Training plan was not found", "PLAN_NOT_FOUND");
    await dataSource.transaction(async (manager) => { await manager.delete(PlanWorkout, { planId: id }); await manager.remove(plan); });
    res.status(204).end();
  }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
