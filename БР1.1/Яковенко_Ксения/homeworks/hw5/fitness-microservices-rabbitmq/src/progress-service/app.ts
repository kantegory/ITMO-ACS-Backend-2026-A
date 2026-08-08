import 'reflect-metadata';
import { envInt, envString } from '../shared/env';
import { createServiceApp, finishServiceApp } from '../shared/app';
import {
  AuthenticatedRequest,
  currentUser,
  requireGatewayUser,
  requireInternalToken,
} from '../shared/auth-context';
import {
  asyncHandler,
  HttpError,
  pagination,
  parsePositiveInt,
  requireString,
} from '../shared/http';
import { serviceRequest } from '../shared/service-client';
import { startService } from '../shared/start';
import { progressDataSource } from './data-source';
import { BodyMetric } from './entities/body-metric.entity';
import { WorkoutSession } from './entities/workout-session.entity';

const app = createServiceApp('progress-service');
const port = envInt('PROGRESS_PORT', 3004);
const catalogUrl = envString('CATALOG_SERVICE_URL', 'http://localhost:3002');
const plansUrl = envString('PLANS_SERVICE_URL', 'http://localhost:3003');

type Workout = { id: number; [key: string]: unknown };

function decimal(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(422, 'Metric values must be non-negative numbers', 'VALIDATION_ERROR');
  }
  return String(number);
}

async function enrichSessions(items: WorkoutSession[]) {
  const ids = [...new Set(items.map((item) => item.workoutId))];
  if (!ids.length) return items;
  const response = await serviceRequest<{ items: Workout[] }>(
    catalogUrl,
    '/api/internal/workouts/batch',
    {
      method: 'POST',
      body: { ids },
    },
  );
  const workouts = new Map(response.items.map((workout) => [workout.id, workout]));
  return items.map((item) => ({ ...item, workout: workouts.get(item.workoutId) ?? null }));
}

app.get(
  '/api/users/me/body-metrics',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const qb = progressDataSource
      .getRepository(BodyMetric)
      .createQueryBuilder('metric')
      .where('metric.userId = :userId', { userId: user.id });
    if (req.query.dateFrom)
      qb.andWhere('metric.measuredAt >= :dateFrom', { dateFrom: req.query.dateFrom });
    if (req.query.dateTo) qb.andWhere('metric.measuredAt <= :dateTo', { dateTo: req.query.dateTo });
    qb.orderBy('metric.measuredAt', 'DESC');
    const { page, pageSize, skip } = pagination(req.query);
    qb.skip(skip).take(pageSize);
    const [items, totalItems] = await qb.getManyAndCount();
    res.json({
      items,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    });
  }),
);

app.post(
  '/api/users/me/body-metrics',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const repository = progressDataSource.getRepository(BodyMetric);
    const bodyMetric = await repository.save(
      repository.create({
        userId: user.id,
        measuredAt: requireString(req.body.measuredAt, 'measuredAt'),
        weightKg: decimal(req.body.weightKg),
        chestCm: decimal(req.body.chestCm),
        waistCm: decimal(req.body.waistCm),
        hipsCm: decimal(req.body.hipsCm),
        bodyFatPercent: decimal(req.body.bodyFatPercent),
        comment: req.body.comment,
      }),
    );
    res.status(201).json({ bodyMetric });
  }),
);

app.patch(
  '/api/users/me/body-metrics/:id',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const id = parsePositiveInt(req.params.id, 'id');
    const repository = progressDataSource.getRepository(BodyMetric);
    const item = await repository.findOneBy({ id, userId: user.id });
    if (!item) throw new HttpError(404, 'Body metric not found', 'BODY_METRIC_NOT_FOUND');

    if (req.body.measuredAt !== undefined)
      item.measuredAt = requireString(req.body.measuredAt, 'measuredAt');
    if (req.body.weightKg !== undefined) item.weightKg = decimal(req.body.weightKg);
    if (req.body.chestCm !== undefined) item.chestCm = decimal(req.body.chestCm);
    if (req.body.waistCm !== undefined) item.waistCm = decimal(req.body.waistCm);
    if (req.body.hipsCm !== undefined) item.hipsCm = decimal(req.body.hipsCm);
    if (req.body.bodyFatPercent !== undefined)
      item.bodyFatPercent = decimal(req.body.bodyFatPercent);
    if (req.body.comment !== undefined) item.comment = req.body.comment;
    await repository.save(item);
    res.json({ bodyMetric: item });
  }),
);

app.delete(
  '/api/users/me/body-metrics/:id',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const id = parsePositiveInt(req.params.id, 'id');
    const repository = progressDataSource.getRepository(BodyMetric);
    const item = await repository.findOneBy({ id, userId: user.id });
    if (!item) throw new HttpError(404, 'Body metric not found', 'BODY_METRIC_NOT_FOUND');
    await repository.remove(item);
    res.json({ success: true });
  }),
);

app.get(
  '/api/users/me/workout-sessions',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const qb = progressDataSource
      .getRepository(WorkoutSession)
      .createQueryBuilder('session')
      .where('session.userId = :userId', { userId: user.id });
    if (req.query.workoutId)
      qb.andWhere('session.workoutId = :workoutId', { workoutId: Number(req.query.workoutId) });
    if (req.query.dateFrom)
      qb.andWhere('session.startedAt >= :dateFrom', { dateFrom: req.query.dateFrom });
    if (req.query.dateTo) qb.andWhere('session.startedAt <= :dateTo', { dateTo: req.query.dateTo });
    qb.orderBy('session.startedAt', 'DESC');
    const { page, pageSize, skip } = pagination(req.query);
    qb.skip(skip).take(pageSize);
    const [items, totalItems] = await qb.getManyAndCount();
    res.json({
      items: await enrichSessions(items),
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    });
  }),
);

app.post(
  '/api/users/me/workout-sessions',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const workoutId = parsePositiveInt(req.body.workoutId, 'workoutId');
    const durationFactMin = parsePositiveInt(req.body.durationFactMin, 'durationFactMin');
    const startedAt = new Date(requireString(req.body.startedAt, 'startedAt'));
    const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : undefined;
    if (Number.isNaN(startedAt.getTime()) || (completedAt && Number.isNaN(completedAt.getTime()))) {
      throw new HttpError(422, 'Dates must be valid ISO strings', 'VALIDATION_ERROR');
    }
    if (completedAt && completedAt < startedAt) {
      throw new HttpError(422, 'completedAt cannot be earlier than startedAt', 'VALIDATION_ERROR');
    }

    const workoutResponse = await serviceRequest<{ workout: Workout }>(
      catalogUrl,
      `/api/internal/workouts/${workoutId}`,
    );

    const userTrainingPlanId = req.body.userTrainingPlanId
      ? parsePositiveInt(req.body.userTrainingPlanId, 'userTrainingPlanId')
      : undefined;
    if (userTrainingPlanId) {
      const planResponse = await serviceRequest<{
        userTrainingPlan: { userId: number; status: string };
      }>(plansUrl, `/api/internal/user-training-plans/${userTrainingPlanId}`);
      if (planResponse.userTrainingPlan.userId !== user.id) {
        throw new HttpError(403, 'The user training plan belongs to another user', 'FORBIDDEN');
      }
      if (planResponse.userTrainingPlan.status !== 'active') {
        throw new HttpError(409, 'User training plan is not active', 'USER_PLAN_NOT_ACTIVE');
      }
    }

    const repository = progressDataSource.getRepository(WorkoutSession);
    const session = await repository.save(
      repository.create({
        userId: user.id,
        workoutId,
        userTrainingPlanId,
        startedAt,
        completedAt,
        durationFactMin,
        caloriesFact:
          req.body.caloriesFact === undefined ? undefined : Number(req.body.caloriesFact),
        rating: req.body.rating === undefined ? undefined : Number(req.body.rating),
        notes: req.body.notes,
      }),
    );

    if (userTrainingPlanId && completedAt) {
      await serviceRequest(
        plansUrl,
        `/api/internal/user-training-plans/${userTrainingPlanId}/progress`,
        { method: 'PATCH', body: { completedWorkoutId: workoutId } },
      );
    }

    res.status(201).json({ workoutSession: { ...session, workout: workoutResponse.workout } });
  }),
);

app.get(
  '/api/users/me/workout-sessions/:id',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const id = parsePositiveInt(req.params.id, 'id');
    const session = await progressDataSource
      .getRepository(WorkoutSession)
      .findOneBy({ id, userId: user.id });
    if (!session)
      throw new HttpError(404, 'Workout session not found', 'WORKOUT_SESSION_NOT_FOUND');
    const [enriched] = await enrichSessions([session]);
    res.json({ workoutSession: enriched });
  }),
);

app.get(
  '/api/internal/users/:userId/summary',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const userId = parsePositiveInt(req.params.userId, 'userId');
    const sessionRepository = progressDataSource.getRepository(WorkoutSession);
    const metricRepository = progressDataSource.getRepository(BodyMetric);
    const [sessionCount, completedCount, latestMetric] = await Promise.all([
      sessionRepository.countBy({ userId }),
      sessionRepository
        .createQueryBuilder('session')
        .where('session.userId = :userId', { userId })
        .andWhere('session.completedAt IS NOT NULL')
        .getCount(),
      metricRepository.findOne({ where: { userId }, order: { measuredAt: 'DESC' } }),
    ]);
    res.json({ userId, sessionCount, completedCount, latestMetric });
  }),
);

finishServiceApp(app);

void startService(app, progressDataSource, port, 'progress-service').catch((error) => {
  console.error(error);
  process.exit(1);
});
