import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { In } from 'typeorm';
import { AppDataSource } from './data-source';
import { Review } from './entities/Review';
import {
  asyncHandler, errorHandler, authMiddleware, internalKeyMiddleware,
  BadRequest, Conflict, Forbidden, NotFound, svcGet, svcPostSoft,
} from './common';
import { initBus, publishEvent } from './bus';

const PORT = Number(process.env.PORT || 8084);
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:8082';
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:8081';

interface UserSummary { user_id: number; name: string; email: string; phone: string | null }

async function ratingSummary(restaurantId: number): Promise<{ restaurant_id: number; average_rating: number; reviews_count: number }> {
  const row = await AppDataSource.getRepository(Review).createQueryBuilder('r')
    .select('AVG(r.rating)', 'avg').addSelect('COUNT(r.review_id)', 'cnt')
    .where('r.restaurant_id = :id', { id: restaurantId })
    .getRawOne<{ avg: string | null; cnt: string }>();
  return {
    restaurant_id: restaurantId,
    average_rating: row?.avg ? Number(Number(row.avg).toFixed(2)) : 0,
    reviews_count: Number(row?.cnt ?? 0),
  };
}

async function seed() {
  const repo = AppDataSource.getRepository(Review);
  if (await repo.count()) return;
  await repo.save([
    repo.create({ user_id: 1, restaurant_id: 1, rating: 5, comment: 'Отличный ресторан, вкусная еда!' }),
    repo.create({ user_id: 2, restaurant_id: 1, rating: 4, comment: 'Хорошее место, но чуть шумно.' }),
    repo.create({ user_id: 1, restaurant_id: 3, rating: 5, comment: 'Лучшие хинкали в Москве.' }),
  ]);
  console.log('[review-service] seeded 3 reviews');
}

async function main() {
  await AppDataSource.initialize();
  await seed();
  await initBus();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'review-service' }));

  const api = express.Router();

  api.post('/reviews', authMiddleware, asyncHandler(async (req, res) => {
    const { restaurant_id, rating, comment } = req.body || {};
    const details: { field: string; message: string }[] = [];
    if (!Number.isFinite(restaurant_id)) details.push({ field: 'restaurant_id', message: 'Required' });
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) details.push({ field: 'rating', message: 'Must be between 1 and 5' });
    if (typeof comment === 'string' && comment.length > 1000) details.push({ field: 'comment', message: 'Max 1000 characters' });
    if (details.length) throw BadRequest('Validation failed', details);
    // межсервисный вызов: проверка существования ресторана в catalog-service
    await svcGet(`${CATALOG_URL}/internal/restaurants/${restaurant_id}`);
    const repo = AppDataSource.getRepository(Review);
    if (await repo.findOne({ where: { restaurant_id, user_id: req.user!.user_id } })) throw Conflict('You have already reviewed this restaurant');
    const review = repo.create({ user_id: req.user!.user_id, restaurant_id, rating, comment: comment ?? null });
    await repo.save(review);
    // асинхронное событие: отзыв создан (потребляет notification-service)
    await publishEvent('review.created', {
      review_id: review.review_id, user_id: review.user_id,
      restaurant_id: review.restaurant_id, rating: review.rating,
    });
    const author = await svcPostSoft<UserSummary[]>(`${AUTH_URL}/internal/users/batch`, { user_ids: [review.user_id] }, []);
    res.status(201).json({
      review_id: review.review_id,
      user: author[0] ?? { user_id: review.user_id },
      restaurant_id: review.restaurant_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    });
  }));

  api.put('/reviews/:id', authMiddleware, asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Review);
    const review = await repo.findOne({ where: { review_id: Number(req.params.id) } });
    if (!review) throw NotFound('Review not found');
    if (review.user_id !== req.user!.user_id) throw Forbidden();
    const { rating, comment } = req.body || {};
    const details: { field: string; message: string }[] = [];
    if (rating !== undefined && (!Number.isFinite(rating) || rating < 1 || rating > 5)) details.push({ field: 'rating', message: 'Must be between 1 and 5' });
    if (typeof comment === 'string' && comment.length > 1000) details.push({ field: 'comment', message: 'Max 1000 characters' });
    if (details.length) throw BadRequest('Validation failed', details);
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await repo.save(review);
    const author = await svcPostSoft<UserSummary[]>(`${AUTH_URL}/internal/users/batch`, { user_ids: [review.user_id] }, []);
    res.json({
      review_id: review.review_id,
      user: author[0] ?? { user_id: review.user_id },
      restaurant_id: review.restaurant_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    });
  }));

  api.delete('/reviews/:id', authMiddleware, asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Review);
    const review = await repo.findOne({ where: { review_id: Number(req.params.id) } });
    if (!review) throw NotFound('Review not found');
    if (review.user_id !== req.user!.user_id) throw Forbidden();
    await repo.remove(review);
    res.status(204).send();
  }));

  // публичный список отзывов ресторана — маршрут /restaurants/:id/reviews (роутится через gateway сюда)
  api.get('/restaurants/:id/reviews', asyncHandler(async (req, res) => {
    const restaurantId = Number(req.params.id);
    if (!Number.isFinite(restaurantId) || restaurantId < 1) throw BadRequest('Invalid restaurant id');
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) ?? '10', 10) || 10));
    const repo = AppDataSource.getRepository(Review);
    const [rows, total] = await repo.findAndCount({ where: { restaurant_id: restaurantId }, order: { created_at: 'DESC' }, skip: (page - 1) * limit, take: limit });
    const authorIds = [...new Set(rows.map((r) => r.user_id))];
    const authors = await svcPostSoft<UserSummary[]>(`${AUTH_URL}/internal/users/batch`, { user_ids: authorIds }, []);
    const byId = new Map(authors.map((a) => [a.user_id, a]));
    const summary = await ratingSummary(restaurantId);
    res.json({
      data: rows.map((r) => ({
        review_id: r.review_id,
        user: byId.get(r.user_id) ?? { user_id: r.user_id },
        restaurant_id: r.restaurant_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      })),
      total,
      average_rating: summary.average_rating,
      page,
      limit,
    });
  }));

  app.use('/api/v1', api);

  // ── внутренний API ─────────────────────────────────────────────
  const internal = express.Router();
  internal.use(internalKeyMiddleware);
  internal.get('/restaurants/:id/rating-summary', asyncHandler(async (req, res) => {
    res.json(await ratingSummary(Number(req.params.id)));
  }));
  internal.post('/ratings/batch', asyncHandler(async (req, res) => {
    const ids: number[] = Array.isArray(req.body?.restaurant_ids) ? req.body.restaurant_ids.map(Number) : [];
    if (!ids.length) return res.json([]);
    const rows = await AppDataSource.getRepository(Review).createQueryBuilder('r')
      .select('r.restaurant_id', 'restaurant_id').addSelect('AVG(r.rating)', 'avg').addSelect('COUNT(r.review_id)', 'cnt')
      .where('r.restaurant_id IN (:...ids)', { ids })
      .groupBy('r.restaurant_id')
      .getRawMany<{ restaurant_id: number; avg: string; cnt: string }>();
    const byId = new Map(rows.map((x) => [Number(x.restaurant_id), x]));
    res.json(ids.map((id) => {
      const x = byId.get(id);
      return { restaurant_id: id, average_rating: x?.avg ? Number(Number(x.avg).toFixed(2)) : 0, reviews_count: Number(x?.cnt ?? 0) };
    }));
  }));
  app.use('/internal', internal);

  app.use((_req, _res, next) => next(NotFound('Endpoint not found')));
  app.use(errorHandler);
  app.listen(PORT, () => console.log(`[review-service] listening on :${PORT}`));
}

main().catch((e) => { console.error('[review-service] fatal', e); process.exit(1); });
