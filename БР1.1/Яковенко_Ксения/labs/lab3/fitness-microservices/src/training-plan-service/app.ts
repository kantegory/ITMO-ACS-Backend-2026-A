import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { envInt, envString } from '../shared/env';
import { createServiceApp, finishServiceApp } from '../shared/app';
import {
  AuthenticatedRequest,
  currentUser,
  requireGatewayUser,
  requireInternalToken,
  requireRole,
} from '../shared/auth-context';
import {
  asyncHandler,
  HttpError,
  pagination,
  parsePositiveInt,
  requireString,
} from '../shared/http';
import { serviceRequest } from '../shared/service-client';
import { rabbitMqStatus } from '../shared/rabbitmq';
import { startService } from '../shared/start';
import { plansDataSource } from './data-source';
import { TrainingPlan } from './entities/training-plan.entity';
import { PlanWorkout } from './entities/plan-workout.entity';
import { UserTrainingPlan, UserTrainingPlanStatus } from './entities/user-training-plan.entity';
import { OutboxEvent } from './entities/outbox-event.entity';
import { dispatchPendingOutboxEvents, startOutboxDispatcher } from './outbox';

const app = createServiceApp('training-plan-service');
const port = envInt('PLANS_PORT', 3003);
const catalogUrl = envString('CATALOG_SERVICE_URL', 'http://localhost:3002');

type WorkoutSummary = { id: number; title: string; [key: string]: unknown };

function normalizePlanWorkouts(value: unknown): Array<{
  workoutId: number;
  weekNo: number;
  dayNo: number;
  orderNo: number;
  note?: string;
}> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(422, 'workouts must contain at least one item', 'VALIDATION_ERROR');
  }
  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new HttpError(422, `workouts[${index}] must be an object`, 'VALIDATION_ERROR');
    }
    const object = item as Record<string, unknown>;
    return {
      workoutId: parsePositiveInt(object.workoutId, `workouts[${index}].workoutId`),
      weekNo: parsePositiveInt(object.weekNo, `workouts[${index}].weekNo`),
      dayNo: parsePositiveInt(object.dayNo, `workouts[${index}].dayNo`),
      orderNo: parsePositiveInt(object.orderNo, `workouts[${index}].orderNo`),
      note: typeof object.note === 'string' ? object.note : undefined,
    };
  });
}

async function getPlanDetails(planId: number) {
  const repository = plansDataSource.getRepository(TrainingPlan);
  const trainingPlan = await repository.findOne({
    where: { id: planId },
    relations: ['planWorkouts'],
  });
  if (!trainingPlan) throw new HttpError(404, 'Training plan not found', 'TRAINING_PLAN_NOT_FOUND');

  trainingPlan.planWorkouts.sort((a, b) =>
    a.weekNo !== b.weekNo
      ? a.weekNo - b.weekNo
      : a.dayNo !== b.dayNo
        ? a.dayNo - b.dayNo
        : a.orderNo - b.orderNo,
  );

  const workoutIds = [...new Set(trainingPlan.planWorkouts.map((item) => item.workoutId))];
  const workoutsResponse = workoutIds.length
    ? await serviceRequest<{ items: WorkoutSummary[] }>(
        catalogUrl,
        '/api/internal/workouts/batch',
        {
          method: 'POST',
          body: { ids: workoutIds },
        },
      )
    : { items: [] };
  const difficultyResponse = await serviceRequest<{ difficultyLevel: unknown }>(
    catalogUrl,
    `/api/internal/difficulty-levels/${trainingPlan.difficultyLevelId}`,
  );
  const workoutMap = new Map(workoutsResponse.items.map((item) => [item.id, item]));

  return {
    ...trainingPlan,
    difficultyLevel: difficultyResponse.difficultyLevel,
    planWorkouts: trainingPlan.planWorkouts.map((item) => ({
      ...item,
      workout: workoutMap.get(item.workoutId) ?? null,
    })),
  };
}

app.get('/health/rabbitmq', (_req, res) => {
  res.json({ service: 'training-plan-service', rabbitmq: rabbitMqStatus() });
});

app.get(
  '/api/training-plans',
  asyncHandler(async (req, res) => {
    const repository = plansDataSource.getRepository(TrainingPlan);
    const qb = repository.createQueryBuilder('trainingPlan');
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      qb.andWhere(
        `(LOWER(trainingPlan.title) LIKE LOWER(:q)
          OR LOWER(COALESCE(trainingPlan.description, '')) LIKE LOWER(:q))`,
        { q: `%${req.query.q.trim()}%` },
      );
    }
    if (req.query.difficultyLevelId) {
      qb.andWhere('trainingPlan.difficultyLevelId = :difficultyLevelId', {
        difficultyLevelId: Number(req.query.difficultyLevelId),
      });
    }
    if (req.query.durationWeeksFrom) {
      qb.andWhere('trainingPlan.durationWeeks >= :from', {
        from: Number(req.query.durationWeeksFrom),
      });
    }
    if (req.query.durationWeeksTo) {
      qb.andWhere('trainingPlan.durationWeeks <= :to', { to: Number(req.query.durationWeeksTo) });
    }
    qb.orderBy('trainingPlan.createdAt', 'DESC');
    const { page, pageSize, skip } = pagination(req.query);
    qb.skip(skip).take(pageSize);
    const [items, totalItems] = await qb.getManyAndCount();
    res.json({
      items,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    });
  }),
);

app.get(
  '/api/training-plans/:id',
  asyncHandler(async (req, res) => {
    const trainingPlan = await getPlanDetails(parsePositiveInt(req.params.id, 'id'));
    res.json({ trainingPlan });
  }),
);

app.post(
  '/api/training-plans',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const difficultyLevelId = parsePositiveInt(req.body.difficultyLevelId, 'difficultyLevelId');
    const durationWeeks = parsePositiveInt(req.body.durationWeeks, 'durationWeeks');
    const workouts = normalizePlanWorkouts(req.body.workouts);

    await serviceRequest(catalogUrl, `/api/internal/difficulty-levels/${difficultyLevelId}`);
    const workoutIds = [...new Set(workouts.map((item) => item.workoutId))];
    const checked = await serviceRequest<{ items: WorkoutSummary[]; missingIds: number[] }>(
      catalogUrl,
      '/api/internal/workouts/batch',
      { method: 'POST', body: { ids: workoutIds } },
    );
    if (checked.missingIds.length) {
      throw new HttpError(400, 'One or more workouts were not found', 'WORKOUT_NOT_FOUND', {
        missingIds: checked.missingIds,
      });
    }

    const planRepository = plansDataSource.getRepository(TrainingPlan);
    const savedPlan = await planRepository.save(
      planRepository.create({
        title: requireString(req.body.title, 'title'),
        description: req.body.description,
        difficultyLevelId,
        durationWeeks,
        authorId: user.id,
      }),
    );

    const planWorkoutRepository = plansDataSource.getRepository(PlanWorkout);
    await planWorkoutRepository.save(
      workouts.map((item) => planWorkoutRepository.create({ ...item, planId: savedPlan.id })),
    );

    res.status(201).json({ trainingPlan: await getPlanDetails(savedPlan.id) });
  }),
);

app.post(
  '/api/training-plans/:id/enroll',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const planId = parsePositiveInt(req.params.id, 'id');
    const startDate = requireString(req.body.startDate, 'startDate');
    const plan = await plansDataSource.getRepository(TrainingPlan).findOneBy({ id: planId });
    if (!plan) throw new HttpError(404, 'Training plan not found', 'TRAINING_PLAN_NOT_FOUND');

    const repository = plansDataSource.getRepository(UserTrainingPlan);
    const existing = await repository.findOneBy({ userId: user.id, planId, status: 'active' });
    if (existing) {
      throw new HttpError(409, 'User is already enrolled in this plan', 'ALREADY_ENROLLED');
    }

    const eventId = randomUUID();
    const queryRunner = plansDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let userTrainingPlan: UserTrainingPlan;
    try {
      userTrainingPlan = await queryRunner.manager.getRepository(UserTrainingPlan).save(
        queryRunner.manager.getRepository(UserTrainingPlan).create({
          userId: user.id,
          planId,
          startDate,
          status: 'active',
          progressPercent: 0,
        }),
      );

      await queryRunner.manager.getRepository(OutboxEvent).save(
        queryRunner.manager.getRepository(OutboxEvent).create({
          id: eventId,
          eventType: 'training-plan.enrolled.v1',
          routingKey: 'training-plan.enrolled',
          version: 1,
          payload: {
            userId: user.id,
            planId,
            userTrainingPlanId: userTrainingPlan.id,
            planTitle: plan.title,
            startDate,
          },
        }),
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    void dispatchPendingOutboxEvents();
    res.status(201).json({ userTrainingPlan, eventQueued: true, eventId });
  }),
);

app.get(
  '/api/users/me/training-plans',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const items = await plansDataSource.getRepository(UserTrainingPlan).find({
      where: { userId: user.id },
      relations: ['trainingPlan'],
      order: { createdAt: 'DESC' },
    });
    res.json({ items });
  }),
);

app.patch(
  '/api/users/me/training-plans/:userTrainingPlanId',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const id = parsePositiveInt(req.params.userTrainingPlanId, 'userTrainingPlanId');
    const repository = plansDataSource.getRepository(UserTrainingPlan);
    const item = await repository.findOneBy({ id, userId: user.id });
    if (!item) throw new HttpError(404, 'User training plan not found', 'USER_PLAN_NOT_FOUND');

    if (req.body.status !== undefined) {
      const allowed: UserTrainingPlanStatus[] = ['active', 'completed', 'cancelled'];
      if (!allowed.includes(req.body.status)) {
        throw new HttpError(422, 'status is invalid', 'VALIDATION_ERROR');
      }
      item.status = req.body.status;
    }
    if (req.body.endDate !== undefined) item.endDate = req.body.endDate;
    if (req.body.progressPercent !== undefined) {
      const progress = Number(req.body.progressPercent);
      if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
        throw new HttpError(422, 'progressPercent must be between 0 and 100', 'VALIDATION_ERROR');
      }
      item.progressPercent = progress;
      if (progress === 100) item.status = 'completed';
    }
    await repository.save(item);
    res.json({ userTrainingPlan: item });
  }),
);

app.get(
  '/api/internal/user-training-plans/:userTrainingPlanId',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.userTrainingPlanId, 'userTrainingPlanId');
    const userTrainingPlan = await plansDataSource.getRepository(UserTrainingPlan).findOne({
      where: { id },
      relations: ['trainingPlan'],
    });
    if (!userTrainingPlan) {
      throw new HttpError(404, 'User training plan not found', 'USER_PLAN_NOT_FOUND');
    }
    res.json({ userTrainingPlan });
  }),
);

app.patch(
  '/api/internal/user-training-plans/:userTrainingPlanId/progress',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.userTrainingPlanId, 'userTrainingPlanId');
    const repository = plansDataSource.getRepository(UserTrainingPlan);
    const item = await repository.findOneBy({ id });
    if (!item) throw new HttpError(404, 'User training plan not found', 'USER_PLAN_NOT_FOUND');

    const requested = req.body.progressPercent;
    const increment = req.body.incrementBy;
    const completedWorkoutId = req.body.completedWorkoutId;
    let nextProgress = item.progressPercent;
    if (requested !== undefined) {
      nextProgress = Number(requested);
    } else if (increment !== undefined) {
      nextProgress += Number(increment);
    } else if (completedWorkoutId !== undefined) {
      const workoutId = parsePositiveInt(completedWorkoutId, 'completedWorkoutId');
      const planWorkoutRepository = plansDataSource.getRepository(PlanWorkout);
      const belongsToPlan = await planWorkoutRepository.findOneBy({
        planId: item.planId,
        workoutId,
      });
      if (!belongsToPlan) {
        throw new HttpError(
          409,
          'Workout does not belong to this training plan',
          'WORKOUT_NOT_IN_PLAN',
        );
      }
      const workoutCount = await planWorkoutRepository.countBy({ planId: item.planId });
      nextProgress += workoutCount > 0 ? 100 / workoutCount : 0;
    } else {
      throw new HttpError(
        422,
        'progressPercent, incrementBy or completedWorkoutId is required',
        'VALIDATION_ERROR',
      );
    }

    if (!Number.isFinite(nextProgress)) {
      throw new HttpError(422, 'Progress value must be a number', 'VALIDATION_ERROR');
    }
    item.progressPercent = Math.max(0, Math.min(100, Math.round(nextProgress)));
    if (item.progressPercent === 100) item.status = 'completed';
    await repository.save(item);
    res.json({ userTrainingPlan: item });
  }),
);

finishServiceApp(app);

void startService(app, plansDataSource, port, 'training-plan-service', () => {
  startOutboxDispatcher();
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
