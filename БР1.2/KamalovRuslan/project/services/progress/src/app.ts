import express from "express";
import { z } from "zod";
import {
  asyncHandler,
  authRequired,
  errorHandler,
  health,
  HttpError,
  notFound,
  validate,
} from "@fitflow/shared";
import { dataSource } from "./data-source.js";
import { ProgressEntry } from "./entities.js";

const uuid = z.string().uuid();
const bodySchema = z.object({
  workoutId: uuid,
  durationMinutes: z.number().int().min(1).max(600),
  notes: z.string().trim().max(2000).nullable().optional(),
  completedAt: z.coerce
    .date()
    .refine(
      (value) => value <= new Date(),
      "Completion cannot be in the future",
    ),
});

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));
  app.get("/health", (_req, res) => res.json(health("progress")));

  app.use("/progress", authRequired);
  app.get(
    "/progress",
    asyncHandler(async (req, res) => {
      const query = validate(
        z.object({ workoutId: uuid.optional() }),
        req.query,
      );
      res.json(
        await dataSource.getRepository(ProgressEntry).find({
          where: {
            userId: req.auth!.sub,
            ...(query.workoutId ? { workoutId: query.workoutId } : {}),
          },
          order: { completedAt: "DESC" },
        }),
      );
    }),
  );
  app.get(
    "/progress/summary",
    asyncHandler(async (req, res) => {
      const result = await dataSource
        .getRepository(ProgressEntry)
        .createQueryBuilder("entry")
        .select("COUNT(*)", "completedWorkouts")
        .addSelect("COALESCE(SUM(entry.duration_minutes), 0)", "totalMinutes")
        .where("entry.user_id = :userId", { userId: req.auth!.sub })
        .getRawOne<{ completedWorkouts: string; totalMinutes: string }>();
      res.json({
        completedWorkouts: Number(result?.completedWorkouts ?? 0),
        totalMinutes: Number(result?.totalMinutes ?? 0),
      });
    }),
  );
  app.post(
    "/progress",
    asyncHandler(async (req, res) => {
      const body = validate(bodySchema, req.body);
      const entry = dataSource
        .getRepository(ProgressEntry)
        .create({ ...body, notes: body.notes ?? null, userId: req.auth!.sub });
      res
        .status(201)
        .json(await dataSource.getRepository(ProgressEntry).save(entry));
    }),
  );
  app.delete(
    "/progress/:id",
    asyncHandler(async (req, res) => {
      const id = validate(uuid, req.params.id);
      const repo = dataSource.getRepository(ProgressEntry);
      const entry = await repo.findOneBy({ id, userId: req.auth!.sub });
      if (!entry)
        throw new HttpError(
          404,
          "Progress entry was not found",
          "PROGRESS_NOT_FOUND",
        );
      await repo.remove(entry);
      res.status(204).end();
    }),
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
