import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { Brackets } from "typeorm";
import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validate,
} from "class-validator";
import { Type } from "class-transformer";
import { AppDataSource } from "./config/data-source";
import { Workout, WorkoutLevel, WorkoutType } from "./entities/Workout";
import { WorkoutCategory } from "./entities/WorkoutCategory";
import {
  asyncHandler,
  authenticate,
  authorize,
  errorHandler,
  EventBus,
  NotFoundError,
  notFoundHandler,
  ValidationError,
} from "@fitness/shared";

const SERVICE_NAME = "catalog-service";

class FiltersDto {
  @IsOptional() @IsString() type?: WorkoutType;
  @IsOptional() @IsString() level?: WorkoutLevel;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) minDuration?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxDuration?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
class CreateWorkoutDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsOptional() @IsString() instructions?: string;
  @IsUrl({ require_tld: false }) videoUrl: string;
  @IsOptional() @IsUrl({ require_tld: false }) thumbnailUrl?: string;
  @IsEnum(["cardio", "strength", "yoga", "stretching", "hiit", "mixed"])
  type: WorkoutType;
  @IsEnum(["beginner", "intermediate", "advanced"]) level: WorkoutLevel;
  @IsInt() @Min(1) @Max(600) durationMinutes: number;
  @IsOptional() @IsInt() @Min(0) caloriesBurned?: number;
}

const validateDto = async <T extends object>(cls: new () => T, payload: object): Promise<T> => {
  const instance = plainToInstance(cls, payload, { enableImplicitConversion: true });
  const errors = await validate(instance as object, { whitelist: true });
  if (errors.length) {
    throw new ValidationError(
      errors.map((e) => ({ property: e.property, constraints: e.constraints })),
    );
  }
  return instance;
};

export const createApp = (bus: EventBus) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  const wRepo = () => AppDataSource.getRepository(Workout);
  const cRepo = () => AppDataSource.getRepository(WorkoutCategory);
  const jwtSecret = process.env.JWT_SECRET ?? "super_secret_change_me";

  app.get("/health", (_req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

  // ===== Public =====

  app.get(
    "/workouts/categories",
    asyncHandler(async (_req, res) => {
      res.json(await cRepo().find({ order: { name: "ASC" } }));
    }),
  );

  app.get(
    "/workouts",
    asyncHandler(async (req: Request, res: Response) => {
      const f = await validateDto(FiltersDto, req.query);
      const page = f.page ?? 1;
      const limit = f.limit ?? 20;
      const qb = wRepo()
        .createQueryBuilder("w")
        .leftJoinAndSelect("w.category", "c")
        .where("w.active = :active", { active: true })
        .orderBy("w.createdAt", "DESC")
        .skip((page - 1) * limit)
        .take(limit);
      if (f.type) qb.andWhere("w.type = :type", { type: f.type });
      if (f.level) qb.andWhere("w.level = :level", { level: f.level });
      if (f.minDuration) qb.andWhere("w.durationMinutes >= :mn", { mn: f.minDuration });
      if (f.maxDuration) qb.andWhere("w.durationMinutes <= :mx", { mx: f.maxDuration });
      if (f.search) {
        qb.andWhere(
          new Brackets((b) => {
            b.where("LOWER(w.title) LIKE :s", { s: `%${f.search!.toLowerCase()}%` }).orWhere(
              "LOWER(w.description) LIKE :s",
              { s: `%${f.search!.toLowerCase()}%` },
            );
          }),
        );
      }
      const [items, total] = await qb.getManyAndCount();
      res.json({ items, total, page, limit });
    }),
  );

  app.get(
    "/workouts/:id",
    asyncHandler(async (req, res) => {
      const w = await wRepo().findOne({ where: { id: req.params.id } });
      if (!w) throw new NotFoundError("Workout not found");
      res.json(w);
    }),
  );

  app.post(
    "/workouts",
    authenticate(jwtSecret),
    authorize("admin", "trainer"),
    asyncHandler(async (req: Request, res: Response) => {
      const dto = await validateDto(CreateWorkoutDto, req.body);
      const w = await wRepo().save(wRepo().create(dto));
      await bus.publish("workout.created", {
        id: w.id,
        title: w.title,
        type: w.type,
        level: w.level,
        durationMinutes: w.durationMinutes,
      });
      res.status(201).json(w);
    }),
  );

  app.patch(
    "/workouts/:id",
    authenticate(jwtSecret),
    authorize("admin", "trainer"),
    asyncHandler(async (req, res) => {
      const w = await wRepo().findOne({ where: { id: req.params.id } });
      if (!w) throw new NotFoundError("Workout not found");
      Object.assign(w, req.body);
      await wRepo().save(w);
      await bus.publish("workout.updated", {
        id: w.id,
        title: w.title,
        type: w.type,
        level: w.level,
        durationMinutes: w.durationMinutes,
      });
      res.json(w);
    }),
  );

  app.delete(
    "/workouts/:id",
    authenticate(jwtSecret),
    authorize("admin", "trainer"),
    asyncHandler(async (req, res) => {
      const result = await wRepo().delete({ id: req.params.id });
      if (!result.affected) throw new NotFoundError("Workout not found");
      await bus.publish("workout.deleted", { id: req.params.id });
      res.status(204).send();
    }),
  );

  // ===== Internal =====

  app.get(
    "/internal/workouts/:id",
    asyncHandler(async (req, res) => {
      const w = await wRepo().findOne({ where: { id: req.params.id } });
      if (!w) return res.status(404).json({ error: "Workout not found" });
      res.json({
        id: w.id,
        title: w.title,
        type: w.type,
        level: w.level,
        durationMinutes: w.durationMinutes,
        thumbnailUrl: w.thumbnailUrl,
        active: w.active,
      });
    }),
  );

  app.post(
    "/internal/workouts/batch",
    asyncHandler(async (req, res) => {
      const { ids } = req.body ?? {};
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
      const ws = await wRepo()
        .createQueryBuilder("w")
        .where("w.id IN (:...ids)", { ids: ids.length ? ids : [""] })
        .getMany();
      res.json(
        ws.map((w) => ({
          id: w.id,
          title: w.title,
          type: w.type,
          level: w.level,
          durationMinutes: w.durationMinutes,
          thumbnailUrl: w.thumbnailUrl,
          active: w.active,
        })),
      );
    }),
  );

  app.use("/internal/events", bus.router);

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
};
