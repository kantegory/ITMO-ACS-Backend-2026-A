import 'reflect-metadata';
import { In } from 'typeorm';
import { envInt } from '../shared/env';
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
import { startService } from '../shared/start';
import { catalogDataSource } from './data-source';
import { DifficultyLevel } from './entities/difficulty-level.entity';
import { WorkoutType } from './entities/workout-type.entity';
import { Workout } from './entities/workout.entity';

const app = createServiceApp('workout-catalog-service');
const port = envInt('CATALOG_PORT', 3002);

function parseIds(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter((id) => Number.isInteger(id) && id > 0);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }
  return [];
}

app.get(
  '/api/workouts',
  asyncHandler(async (req, res) => {
    const repository = catalogDataSource.getRepository(Workout);
    const qb = repository
      .createQueryBuilder('workout')
      .leftJoinAndSelect('workout.difficultyLevel', 'difficultyLevel')
      .leftJoinAndSelect('workout.types', 'types')
      .distinct(true);

    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      qb.andWhere(
        `(LOWER(workout.title) LIKE LOWER(:q)
          OR LOWER(COALESCE(workout.description, '')) LIKE LOWER(:q))`,
        { q: `%${req.query.q.trim()}%` },
      );
    }
    if (req.query.difficultyLevelId) {
      qb.andWhere('workout.difficultyLevelId = :difficultyLevelId', {
        difficultyLevelId: Number(req.query.difficultyLevelId),
      });
    }
    if (req.query.durationMinFrom) {
      qb.andWhere('workout.durationMin >= :durationMinFrom', {
        durationMinFrom: Number(req.query.durationMinFrom),
      });
    }
    if (req.query.durationMinTo) {
      qb.andWhere('workout.durationMin <= :durationMinTo', {
        durationMinTo: Number(req.query.durationMinTo),
      });
    }
    const typeIds = parseIds(req.query.typeIds);
    if (typeIds.length) qb.andWhere('types.id IN (:...typeIds)', { typeIds });

    const allowedSort = new Set(['createdAt', 'durationMin', 'title']);
    const sortBy = allowedSort.has(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : 'createdAt';
    const sortOrder = String(req.query.sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`workout.${sortBy}`, sortOrder as 'ASC' | 'DESC');

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
  '/api/workouts/:id',
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const workout = await catalogDataSource.getRepository(Workout).findOne({
      where: { id },
      relations: ['difficultyLevel', 'types'],
    });
    if (!workout) throw new HttpError(404, 'Workout not found', 'WORKOUT_NOT_FOUND');
    res.json({ workout });
  }),
);

app.post(
  '/api/workouts',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const difficultyLevelId = parsePositiveInt(req.body.difficultyLevelId, 'difficultyLevelId');
    const durationMin = parsePositiveInt(req.body.durationMin, 'durationMin');
    const typeIds = parseIds(req.body.typeIds);
    if (typeIds.length === 0) {
      throw new HttpError(422, 'At least one workout type is required', 'VALIDATION_ERROR');
    }

    const difficulty = await catalogDataSource
      .getRepository(DifficultyLevel)
      .findOneBy({ id: difficultyLevelId });
    if (!difficulty) throw new HttpError(400, 'Difficulty level not found', 'DIFFICULTY_NOT_FOUND');

    const types = await catalogDataSource.getRepository(WorkoutType).findBy({ id: In(typeIds) });
    if (types.length !== new Set(typeIds).size) {
      throw new HttpError(
        400,
        'One or more workout types were not found',
        'WORKOUT_TYPE_NOT_FOUND',
      );
    }

    const repository = catalogDataSource.getRepository(Workout);
    const workout = await repository.save(
      repository.create({
        title: requireString(req.body.title, 'title'),
        description: req.body.description,
        instructions: req.body.instructions,
        durationMin,
        videoUrl: req.body.videoUrl,
        caloriesEstimate:
          req.body.caloriesEstimate === undefined ? undefined : Number(req.body.caloriesEstimate),
        difficultyLevelId,
        authorId: user.id,
        types,
      }),
    );

    const fullWorkout = await repository.findOne({
      where: { id: workout.id },
      relations: ['difficultyLevel', 'types'],
    });
    res.status(201).json({ workout: fullWorkout });
  }),
);

app.get(
  '/api/metadata/difficulty-levels',
  asyncHandler(async (_req, res) => {
    const items = await catalogDataSource.getRepository(DifficultyLevel).find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    res.json({ items });
  }),
);

app.post(
  '/api/metadata/difficulty-levels',
  requireGatewayUser,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const repository = catalogDataSource.getRepository(DifficultyLevel);
    const item = await repository.save(
      repository.create({
        name: requireString(req.body.name, 'name'),
        sortOrder: Number(req.body.sortOrder ?? 1),
        description: req.body.description,
      }),
    );
    res.status(201).json({ difficultyLevel: item });
  }),
);

app.get(
  '/api/metadata/workout-types',
  asyncHandler(async (_req, res) => {
    const items = await catalogDataSource.getRepository(WorkoutType).find({ order: { id: 'ASC' } });
    res.json({ items });
  }),
);

app.post(
  '/api/metadata/workout-types',
  requireGatewayUser,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const repository = catalogDataSource.getRepository(WorkoutType);
    const item = await repository.save(
      repository.create({
        name: requireString(req.body.name, 'name'),
        slug: requireString(req.body.slug, 'slug'),
        description: req.body.description,
      }),
    );
    res.status(201).json({ workoutType: item });
  }),
);

app.get(
  '/api/internal/workouts/:workoutId',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.workoutId, 'workoutId');
    const workout = await catalogDataSource.getRepository(Workout).findOne({
      where: { id },
      relations: ['difficultyLevel', 'types'],
    });
    if (!workout) throw new HttpError(404, 'Workout not found', 'WORKOUT_NOT_FOUND');
    res.json({ workout });
  }),
);

app.post(
  '/api/internal/workouts/batch',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const ids = [...new Set(parseIds(req.body.ids))];
    if (!ids.length) throw new HttpError(422, 'ids must not be empty', 'VALIDATION_ERROR');
    const items = await catalogDataSource.getRepository(Workout).find({
      where: { id: In(ids) },
      relations: ['difficultyLevel', 'types'],
    });
    res.json({ items, missingIds: ids.filter((id) => !items.some((item) => item.id === id)) });
  }),
);

app.get(
  '/api/internal/difficulty-levels/:id',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, 'id');
    const difficultyLevel = await catalogDataSource
      .getRepository(DifficultyLevel)
      .findOneBy({ id });
    if (!difficultyLevel) {
      throw new HttpError(404, 'Difficulty level not found', 'DIFFICULTY_NOT_FOUND');
    }
    res.json({ difficultyLevel });
  }),
);

finishServiceApp(app);

void startService(app, catalogDataSource, port, 'workout-catalog-service').catch((error) => {
  console.error(error);
  process.exit(1);
});
