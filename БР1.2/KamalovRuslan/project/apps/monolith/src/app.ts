import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { z } from "zod";
import { In } from "typeorm";
import {
  HttpError,
  adminRequired,
  asyncHandler,
  authRequired,
  errorHandler,
  health,
  notFound,
  signAccessToken,
  validate,
} from "@fitflow/shared";
import { appDataSource } from "./data-source.js";
import { Article, PlanWorkout, ProgressEntry, TrainingPlan, User, Workout } from "./entities.js";

const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});
const registerSchema = credentialsSchema.extend({ name: z.string().min(2).max(100) });
const workoutSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(["cardio", "strength", "mobility"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  durationMinutes: z.number().int().min(5).max(300),
  description: z.string().min(10).max(5000),
  videoUrl: z.string().url().nullable().optional(),
});
const progressSchema = z.object({
  workoutId: z.string().uuid(),
  durationMinutes: z.number().int().min(1).max(600),
  notes: z.string().max(2000).nullable().optional(),
  completedAt: z.string().datetime().optional(),
});

function publicUser(user: User) {
  const { passwordHash: _, ...result } = user;
  return result;
}

function routeParam(value: string | string[] | undefined): string {
  if (typeof value !== "string") throw new HttpError(400, "Route parameter is invalid", "INVALID_PARAMETER");
  return value;
}

async function fullPlan(plan: TrainingPlan) {
  const links = await appDataSource
    .getRepository(PlanWorkout)
    .find({ where: { planId: plan.id }, order: { position: "ASC" } });
  const workouts = links.length
    ? await appDataSource.getRepository(Workout).findBy({ id: In(links.map((link) => link.workoutId)) })
    : [];
  const byId = new Map(workouts.map((workout) => [workout.id, workout]));
  return { ...plan, workouts: links.map((link) => byId.get(link.workoutId)).filter(Boolean) };
}

function loadOpenApi(): object | null {
  try {
    return YAML.parse(readFileSync("docs/openapi.yaml", "utf8")) as object;
  } catch {
    return null;
  }
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json(health("fitflow-monolith")));
  const openApi = loadOpenApi();
  if (openApi) app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApi));

  app.post(
    "/api/v1/auth/register",
    asyncHandler(async (req, res) => {
      const input = validate(registerSchema, req.body);
      const users = appDataSource.getRepository(User);
      if (await users.existsBy({ email: input.email })) {
        throw new HttpError(409, "Email is already registered", "EMAIL_TAKEN");
      }
      const user = users.create({
        email: input.email,
        name: input.name,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: "user",
      });
      await users.save(user);
      const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
      res.status(201).json({ user: publicUser(user), accessToken: token });
    }),
  );

  app.post(
    "/api/v1/auth/login",
    asyncHandler(async (req, res) => {
      const input = validate(credentialsSchema, req.body);
      const user = await appDataSource.getRepository(User).findOneBy({ email: input.email });
      if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
        throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
      }
      const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
      res.json({ user: publicUser(user), accessToken: token });
    }),
  );

  app.get(
    "/api/v1/users/me",
    authRequired,
    asyncHandler(async (req, res) => {
      const user = await appDataSource.getRepository(User).findOneBy({ id: req.auth!.sub });
      if (!user) throw new HttpError(404, "User was not found", "USER_NOT_FOUND");
      res.json(publicUser(user));
    }),
  );

  app.get(
    "/api/v1/auth/me",
    authRequired,
    asyncHandler(async (req, res) => {
      const user = await appDataSource.getRepository(User).findOneBy({ id: req.auth!.sub });
      if (!user) throw new HttpError(404, "User was not found", "USER_NOT_FOUND");
      res.json(publicUser(user));
    }),
  );

  app.patch(
    "/api/v1/users/me",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(z.object({ name: z.string().min(2).max(100) }), req.body);
      const users = appDataSource.getRepository(User);
      const user = await users.findOneBy({ id: req.auth!.sub });
      if (!user) throw new HttpError(404, "User was not found", "USER_NOT_FOUND");
      user.name = input.name;
      await users.save(user);
      res.json(publicUser(user));
    }),
  );

  app.get(
    "/api/v1/workouts",
    asyncHandler(async (req, res) => {
      const query = validate(
        z.object({
          type: z.enum(["cardio", "strength", "mobility"]).optional(),
          level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          maxDuration: z.coerce.number().int().positive().optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
        req.query,
      );
      const builder = appDataSource.getRepository(Workout).createQueryBuilder("workout");
      if (query.type) builder.andWhere("workout.type = :type", { type: query.type });
      if (query.level) builder.andWhere("workout.level = :level", { level: query.level });
      if (query.maxDuration) {
        builder.andWhere("workout.durationMinutes <= :maxDuration", { maxDuration: query.maxDuration });
      }
      const [items, total] = await builder
        .orderBy("workout.createdAt", "DESC")
        .skip((query.page - 1) * query.limit)
        .take(query.limit)
        .getManyAndCount();
      res.json({ items, total, limit: query.limit, page: query.page });
    }),
  );

  app.get(
    "/api/v1/workouts/:id",
    asyncHandler(async (req, res) => {
      const workout = await appDataSource.getRepository(Workout).findOneBy({ id: routeParam(req.params.id) });
      if (!workout) throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
      res.json(workout);
    }),
  );

  app.post(
    "/api/v1/workouts",
    authRequired,
    adminRequired,
    asyncHandler(async (req, res) => {
      const workout = appDataSource.getRepository(Workout).create(validate(workoutSchema, req.body));
      await appDataSource.getRepository(Workout).save(workout);
      res.status(201).json(workout);
    }),
  );

  app.patch(
    "/api/v1/workouts/:id",
    authRequired,
    adminRequired,
    asyncHandler(async (req, res) => {
      const repository = appDataSource.getRepository(Workout);
      const workout = await repository.findOneBy({ id: routeParam(req.params.id) });
      if (!workout) throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
      Object.assign(workout, validate(workoutSchema.partial(), req.body));
      await repository.save(workout);
      res.json(workout);
    }),
  );

  app.delete(
    "/api/v1/workouts/:id",
    authRequired,
    adminRequired,
    asyncHandler(async (req, res) => {
      const result = await appDataSource.getRepository(Workout).delete({ id: routeParam(req.params.id) });
      if (!result.affected) throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
      res.status(204).end();
    }),
  );

  app.get(
    "/api/v1/plans",
    authRequired,
    asyncHandler(async (req, res) => {
      const plans = await appDataSource.getRepository(TrainingPlan).findBy({ userId: req.auth!.sub });
      res.json(await Promise.all(plans.map(fullPlan)));
    }),
  );

  app.post(
    "/api/v1/plans",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(
        z.object({ name: z.string().min(2).max(120), workoutIds: z.array(z.string().uuid()).max(100).default([]) }),
        req.body,
      );
      const workoutIds = [...new Set(input.workoutIds)];
      if (workoutIds.length && (await appDataSource.getRepository(Workout).countBy({ id: In(workoutIds) })) !== workoutIds.length) {
        throw new HttpError(400, "One or more workouts do not exist", "INVALID_WORKOUTS");
      }
      const plan = await appDataSource.transaction(async (manager) => {
        const saved = await manager.save(
          manager.create(TrainingPlan, { name: input.name, userId: req.auth!.sub }),
        );
        await manager.save(
          workoutIds.map((workoutId, position) => manager.create(PlanWorkout, { planId: saved.id, workoutId, position })),
        );
        return saved;
      });
      res.status(201).json(await fullPlan(plan));
    }),
  );

  app.get(
    "/api/v1/plans/:id",
    authRequired,
    asyncHandler(async (req, res) => {
      const plan = await appDataSource
        .getRepository(TrainingPlan)
        .findOneBy({ id: routeParam(req.params.id), userId: req.auth!.sub });
      if (!plan) throw new HttpError(404, "Plan was not found", "PLAN_NOT_FOUND");
      res.json(await fullPlan(plan));
    }),
  );

  app.patch(
    "/api/v1/plans/:id",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(z.object({ name: z.string().min(2).max(120) }), req.body);
      const repository = appDataSource.getRepository(TrainingPlan);
      const plan = await repository.findOneBy({ id: routeParam(req.params.id), userId: req.auth!.sub });
      if (!plan) throw new HttpError(404, "Plan was not found", "PLAN_NOT_FOUND");
      plan.name = input.name;
      await repository.save(plan);
      res.json(await fullPlan(plan));
    }),
  );

  app.delete(
    "/api/v1/plans/:id",
    authRequired,
    asyncHandler(async (req, res) => {
      const planId = routeParam(req.params.id);
      const repository = appDataSource.getRepository(TrainingPlan);
      const plan = await repository.findOneBy({ id: planId, userId: req.auth!.sub });
      if (!plan) throw new HttpError(404, "Plan was not found", "PLAN_NOT_FOUND");
      await appDataSource.transaction(async (manager) => {
        await manager.getRepository(PlanWorkout).delete({ planId });
        await manager.getRepository(TrainingPlan).remove(plan);
      });
      res.status(204).end();
    }),
  );

  app.post(
    "/api/v1/plans/:id/workouts",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(
        z.object({ workoutId: z.string().uuid(), position: z.number().int().min(0) }),
        req.body,
      );
      const plan = await appDataSource
        .getRepository(TrainingPlan)
        .findOneBy({ id: routeParam(req.params.id), userId: req.auth!.sub });
      if (!plan) throw new HttpError(404, "Plan was not found", "PLAN_NOT_FOUND");
      if (!(await appDataSource.getRepository(Workout).existsBy({ id: input.workoutId }))) {
        throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
      }
      const item = appDataSource.getRepository(PlanWorkout).create({ planId: plan.id, ...input });
      await appDataSource.getRepository(PlanWorkout).save(item);
      res.status(201).json(item);
    }),
  );

  app.put(
    "/api/v1/plans/:id/workouts",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(z.object({ workoutIds: z.array(z.string().uuid()).max(100) }), req.body);
      const planId = routeParam(req.params.id);
      const plan = await appDataSource
        .getRepository(TrainingPlan)
        .findOneBy({ id: planId, userId: req.auth!.sub });
      if (!plan) throw new HttpError(404, "Plan was not found", "PLAN_NOT_FOUND");
      const uniqueIds = [...new Set(input.workoutIds)];
      const existingCount = uniqueIds.length
        ? await appDataSource
            .getRepository(Workout)
            .createQueryBuilder("workout")
            .where("workout.id IN (:...ids)", { ids: uniqueIds })
            .getCount()
        : 0;
      if (existingCount !== uniqueIds.length) {
        throw new HttpError(404, "One or more workouts were not found", "WORKOUT_NOT_FOUND");
      }
      await appDataSource.transaction(async (manager) => {
        await manager.getRepository(PlanWorkout).delete({ planId });
        if (uniqueIds.length) {
          await manager.getRepository(PlanWorkout).save(
            uniqueIds.map((workoutId, position) =>
              manager.getRepository(PlanWorkout).create({ planId, workoutId, position }),
            ),
          );
        }
      });
      res.json(await fullPlan(plan));
    }),
  );

  app.post(
    "/api/v1/progress",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(progressSchema, req.body);
      if (!(await appDataSource.getRepository(Workout).existsBy({ id: input.workoutId }))) {
        throw new HttpError(404, "Workout was not found", "WORKOUT_NOT_FOUND");
      }
      const entry = appDataSource.getRepository(ProgressEntry).create({
        userId: req.auth!.sub,
        workoutId: input.workoutId,
        durationMinutes: input.durationMinutes,
        notes: input.notes ?? null,
        completedAt: input.completedAt ? new Date(input.completedAt) : new Date(),
      });
      await appDataSource.getRepository(ProgressEntry).save(entry);
      res.status(201).json(entry);
    }),
  );

  app.get(
    "/api/v1/progress",
    authRequired,
    asyncHandler(async (req, res) => {
      const entries = await appDataSource.getRepository(ProgressEntry).find({
        where: { userId: req.auth!.sub },
        order: { completedAt: "DESC" },
      });
      res.json(entries);
    }),
  );

  app.get(
    "/api/v1/progress/summary",
    authRequired,
    asyncHandler(async (req, res) => {
      const result = await appDataSource
        .getRepository(ProgressEntry)
        .createQueryBuilder("entry")
        .select("COUNT(entry.id)", "completedWorkouts")
        .addSelect("COALESCE(SUM(entry.durationMinutes), 0)", "totalMinutes")
        .where("entry.userId = :userId", { userId: req.auth!.sub })
        .getRawOne<{ completedWorkouts: string; totalMinutes: string }>();
      res.json({
        completedWorkouts: Number(result?.completedWorkouts ?? 0),
        totalMinutes: Number(result?.totalMinutes ?? 0),
      });
    }),
  );

  app.delete(
    "/api/v1/progress/:id",
    authRequired,
    asyncHandler(async (req, res) => {
      const result = await appDataSource
        .getRepository(ProgressEntry)
        .delete({ id: routeParam(req.params.id), userId: req.auth!.sub });
      if (!result.affected) throw new HttpError(404, "Progress entry was not found", "PROGRESS_NOT_FOUND");
      res.status(204).end();
    }),
  );

  app.get(
    "/api/v1/articles",
    asyncHandler(async (_req, res) => {
      const articles = await appDataSource.getRepository(Article).find({ order: { createdAt: "DESC" } });
      res.json(articles);
    }),
  );

  app.get(
    "/api/v1/articles/:slug",
    asyncHandler(async (req, res) => {
      const article = await appDataSource.getRepository(Article).findOneBy({ slug: routeParam(req.params.slug) });
      if (!article) throw new HttpError(404, "Article was not found", "ARTICLE_NOT_FOUND");
      res.json(article);
    }),
  );

  app.post(
    "/api/v1/articles",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(
        z.object({
          title: z.string().min(3).max(160),
          slug: z.string().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          content: z.string().min(20).max(50_000),
        }),
        req.body,
      );
      if (await appDataSource.getRepository(Article).existsBy({ slug: input.slug })) {
        throw new HttpError(409, "Article slug is already used", "SLUG_TAKEN");
      }
      const article = appDataSource.getRepository(Article).create({
        ...input,
        authorId: req.auth!.sub,
      });
      await appDataSource.getRepository(Article).save(article);
      res.status(201).json(article);
    }),
  );

  app.patch(
    "/api/v1/articles/:id",
    authRequired,
    asyncHandler(async (req, res) => {
      const input = validate(
        z.object({ title: z.string().min(3).max(160), content: z.string().min(20).max(50_000) }).partial(),
        req.body,
      );
      const repository = appDataSource.getRepository(Article);
      const article = await repository.findOneBy({ id: routeParam(req.params.id) });
      if (!article) throw new HttpError(404, "Article was not found", "ARTICLE_NOT_FOUND");
      if (article.authorId !== req.auth!.sub && req.auth!.role !== "admin") {
        throw new HttpError(403, "Only the author can edit this article", "FORBIDDEN");
      }
      Object.assign(article, input);
      await repository.save(article);
      res.json(article);
    }),
  );

  app.delete(
    "/api/v1/articles/:id",
    authRequired,
    asyncHandler(async (req, res) => {
      const repository = appDataSource.getRepository(Article);
      const article = await repository.findOneBy({ id: routeParam(req.params.id) });
      if (!article) throw new HttpError(404, "Article was not found", "ARTICLE_NOT_FOUND");
      if (article.authorId !== req.auth!.sub && req.auth!.role !== "admin") {
        throw new HttpError(403, "Only the author can delete this article", "FORBIDDEN");
      }
      await repository.remove(article);
      res.status(204).end();
    }),
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
