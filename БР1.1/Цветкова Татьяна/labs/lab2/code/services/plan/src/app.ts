import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import axios from "axios";
import { plainToInstance } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID, validate } from "class-validator";
import { AppDataSource } from "./config/data-source";
import { WorkoutPlan } from "./entities/WorkoutPlan";
import { PlanItem } from "./entities/PlanItem";
import {
  asyncHandler,
  authenticate,
  errorHandler,
  EventBus,
  ForbiddenError,
  NotFoundError,
  notFoundHandler,
  ValidationError,
} from "@fitness/shared";

const SERVICE_NAME = "plan-service";

class CreatePlanDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
}
class AddItemDto {
  @IsUUID() workoutId: string;
  @IsOptional() @IsString() notes?: string;
}
class CompleteItemDto {
  @IsBoolean() completed: boolean;
}

const validateDto = async <T extends object>(cls: new () => T, payload: object): Promise<T> => {
  const instance = plainToInstance(cls, payload);
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

  const planRepo = () => AppDataSource.getRepository(WorkoutPlan);
  const itemRepo = () => AppDataSource.getRepository(PlanItem);
  const jwtSecret = process.env.JWT_SECRET ?? "super_secret_change_me";
  const catalogUrl = process.env.CATALOG_SERVICE_URL ?? "http://localhost:3003";

  // ===== Подписки на события catalog-service =====

  bus.on<{ id: string }>("workout.deleted", async (event) => {
    const items = await itemRepo().find({ where: { workoutId: event.payload.id } });
    if (!items.length) return;
    for (const it of items) it.workoutIsStale = true;
    await itemRepo().save(items);
    console.log(
      `[plan-service] marked ${items.length} items as stale for deleted workout ${event.payload.id}`,
    );
  });

  bus.on<{ id: string; title: string; durationMinutes: number; type: string }>(
    "workout.updated",
    async (event) => {
      const items = await itemRepo().find({ where: { workoutId: event.payload.id } });
      for (const it of items) {
        it.workoutTitleSnapshot = event.payload.title;
        it.workoutDurationMin = event.payload.durationMinutes;
        it.workoutType = event.payload.type;
      }
      if (items.length) {
        await itemRepo().save(items);
        console.log(
          `[plan-service] refreshed snapshot for ${items.length} items (workout ${event.payload.id})`,
        );
      }
    },
  );

  bus.on<{ userId: string }>("user.deleted", async (event) => {
    const plans = await planRepo().find({ where: { userId: event.payload.userId } });
    await planRepo().remove(plans);
    console.log(
      `[plan-service] cascade-removed ${plans.length} plans for user ${event.payload.userId}`,
    );
  });

  app.get("/health", (_req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

  app.use("/internal/events", bus.router);

  // ===== Все эндпоинты планов требуют авторизации =====
  app.use(authenticate(jwtSecret));

  app.get(
    "/workout-plans",
    asyncHandler(async (req: Request, res: Response) => {
      const plans = await planRepo().find({
        where: { userId: req.user!.sub },
        order: { createdAt: "DESC" },
      });
      res.json(plans);
    }),
  );

  app.post(
    "/workout-plans",
    asyncHandler(async (req: Request, res: Response) => {
      const dto = await validateDto(CreatePlanDto, req.body);
      const plan = planRepo().create({
        userId: req.user!.sub,
        title: dto.title,
        description: dto.description,
        items: [],
      });
      await planRepo().save(plan);
      res.status(201).json(plan);
    }),
  );

  app.get(
    "/workout-plans/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const plan = await planRepo().findOne({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError("Plan not found");
      if (plan.userId !== req.user!.sub) throw new ForbiddenError();
      res.json(plan);
    }),
  );

  app.delete(
    "/workout-plans/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const plan = await planRepo().findOne({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError("Plan not found");
      if (plan.userId !== req.user!.sub) throw new ForbiddenError();
      await planRepo().remove(plan);
      res.status(204).send();
    }),
  );

  // Добавление тренировки в план — синхронный вызов catalog-service
  app.post(
    "/workout-plans/:id/items",
    asyncHandler(async (req: Request, res: Response) => {
      const dto = await validateDto(AddItemDto, req.body);
      const plan = await planRepo().findOne({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError("Plan not found");
      if (plan.userId !== req.user!.sub) throw new ForbiddenError();

      // sync HTTP call to catalog-service
      let workout: { id: string; title: string; durationMinutes: number; type: string };
      try {
        const resp = await axios.get(`${catalogUrl}/internal/workouts/${dto.workoutId}`, {
          timeout: 2000,
        });
        workout = resp.data;
      } catch (err: any) {
        if (err?.response?.status === 404) throw new NotFoundError("Workout not found in catalog");
        // catalog недоступен — fallback: создаём item без snapshot, помечаем stale
        console.warn(
          `[plan-service] catalog-service unavailable, creating stale item:`,
          err?.message,
        );
        const item = itemRepo().create({
          plan,
          workoutId: dto.workoutId,
          workoutTitleSnapshot: "(catalog unavailable)",
          workoutDurationMin: 0,
          workoutType: "unknown",
          workoutIsStale: true,
          notes: dto.notes,
        });
        await itemRepo().save(item);
        return res.status(201).json(item);
      }

      const item = itemRepo().create({
        plan,
        workoutId: workout.id,
        workoutTitleSnapshot: workout.title,
        workoutDurationMin: workout.durationMinutes,
        workoutType: workout.type,
        workoutIsStale: false,
        notes: dto.notes,
      });
      await itemRepo().save(item);
      res.status(201).json(item);
    }),
  );

  app.patch(
    "/workout-plans/:id/items/:itemId/complete",
    asyncHandler(async (req: Request, res: Response) => {
      const dto = await validateDto(CompleteItemDto, req.body);
      const plan = await planRepo().findOne({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError("Plan not found");
      if (plan.userId !== req.user!.sub) throw new ForbiddenError();
      const item = plan.items.find((i) => i.id === req.params.itemId);
      if (!item) throw new NotFoundError("Item not found");
      item.completed = dto.completed;
      await itemRepo().save(item);
      res.json(item);
    }),
  );

  app.delete(
    "/workout-plans/:id/items/:itemId",
    asyncHandler(async (req: Request, res: Response) => {
      const plan = await planRepo().findOne({ where: { id: req.params.id } });
      if (!plan) throw new NotFoundError("Plan not found");
      if (plan.userId !== req.user!.sub) throw new ForbiddenError();
      const item = plan.items.find((i) => i.id === req.params.itemId);
      if (!item) throw new NotFoundError("Item not found");
      await itemRepo().remove(item);
      res.status(204).send();
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
};
