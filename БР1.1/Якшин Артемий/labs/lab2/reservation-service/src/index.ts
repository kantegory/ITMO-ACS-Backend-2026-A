import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './data-source';
import { Reservation } from './entities/Reservation';
import {
  asyncHandler, errorHandler, authMiddleware, internalKeyMiddleware,
  BadRequest, Conflict, Forbidden, NotFound, svcGet, svcGetSoft,
} from './common';
import { initBus, publishEvent } from './bus';

const PORT = Number(process.env.PORT || 8083);
const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:8082';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

interface TableSummary { table_id: number; restaurant_id: number; table_number: number; capacity: number }
interface RestaurantSummary { restaurant_id: number; name: string; city: string | null; address: string; price_level: string }

async function isTaken(table_id: number, date: string, time: string, excludeId?: number): Promise<boolean> {
  const qb = AppDataSource.getRepository(Reservation).createQueryBuilder('r')
    .where('r.table_id = :tid', { tid: table_id })
    .andWhere('r.reservation_date = :d AND r.reservation_time = :t', { d: date, t: time })
    .andWhere('r.status IN (:...st)', { st: ['pending', 'confirmed'] });
  if (excludeId) qb.andWhere('r.reservation_id != :eid', { eid: excludeId });
  return (await qb.getCount()) > 0;
}

async function serialize(r: Reservation) {
  const restaurant = await svcGetSoft<RestaurantSummary | null>(`${CATALOG_URL}/internal/restaurants/${r.restaurant_id}`, null);
  return {
    reservation_id: r.reservation_id,
    user_id: r.user_id,
    table: { table_id: r.table_id },
    restaurant: restaurant ?? { restaurant_id: r.restaurant_id },
    reservation_date: r.reservation_date,
    reservation_time: r.reservation_time,
    guests_count: r.guests_count,
    status: r.status,
    created_at: r.created_at,
  };
}

async function main() {
  await AppDataSource.initialize();
  await initBus();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'reservation-service' }));

  const api = express.Router();

  api.post('/reservations', authMiddleware, asyncHandler(async (req, res) => {
    const { table_id, reservation_date, reservation_time, guests_count } = req.body || {};
    const details: { field: string; message: string }[] = [];
    if (!Number.isFinite(table_id)) details.push({ field: 'table_id', message: 'Required' });
    if (!reservation_date || !DATE_RE.test(reservation_date)) details.push({ field: 'reservation_date', message: 'Must be YYYY-MM-DD' });
    if (!reservation_time || !TIME_RE.test(reservation_time)) details.push({ field: 'reservation_time', message: 'Must be HH:MM' });
    if (!Number.isFinite(guests_count) || guests_count < 1) details.push({ field: 'guests_count', message: 'Must be >= 1' });
    if (details.length) throw BadRequest('Validation failed', details);

    // межсервисный вызов: валидация столика в catalog-service
    const table = await svcGet<TableSummary>(`${CATALOG_URL}/internal/tables/${table_id}`);
    if (guests_count > table.capacity) throw BadRequest(`Table capacity is ${table.capacity}`);
    if (await isTaken(table_id, reservation_date, reservation_time)) throw Conflict('Table is already booked for this date and time');

    const repo = AppDataSource.getRepository(Reservation);
    const r = repo.create({ user_id: req.user!.user_id, table_id, restaurant_id: table.restaurant_id, reservation_date, reservation_time, guests_count, status: 'confirmed' });
    await repo.save(r);
    // асинхронное событие: бронь создана (потребляет notification-service)
    await publishEvent('reservation.created', {
      reservation_id: r.reservation_id, user_id: r.user_id, restaurant_id: r.restaurant_id,
      table_id: r.table_id, reservation_date: r.reservation_date, reservation_time: r.reservation_time,
      guests_count: r.guests_count, status: r.status,
    });
    res.status(201).json(await serialize(r));
  }));

  api.get('/reservations/:id', authMiddleware, asyncHandler(async (req, res) => {
    const r = await AppDataSource.getRepository(Reservation).findOne({ where: { reservation_id: Number(req.params.id) } });
    if (!r) throw NotFound('Reservation not found');
    if (r.user_id !== req.user!.user_id) throw Forbidden();
    res.json(await serialize(r));
  }));

  api.put('/reservations/:id', authMiddleware, asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Reservation);
    const r = await repo.findOne({ where: { reservation_id: Number(req.params.id) } });
    if (!r) throw NotFound('Reservation not found');
    if (r.user_id !== req.user!.user_id) throw Forbidden();
    const { reservation_date, reservation_time, guests_count } = req.body || {};
    const details: { field: string; message: string }[] = [];
    if (reservation_date !== undefined && !DATE_RE.test(reservation_date)) details.push({ field: 'reservation_date', message: 'Must be YYYY-MM-DD' });
    if (reservation_time !== undefined && !TIME_RE.test(reservation_time)) details.push({ field: 'reservation_time', message: 'Must be HH:MM' });
    if (guests_count !== undefined && (!Number.isFinite(guests_count) || guests_count < 1)) details.push({ field: 'guests_count', message: 'Must be >= 1' });
    if (details.length) throw BadRequest('Validation failed', details);
    const newDate = reservation_date ?? r.reservation_date;
    const newTime = reservation_time ?? r.reservation_time;
    if ((newDate !== r.reservation_date || newTime !== r.reservation_time) && await isTaken(r.table_id, newDate, newTime, r.reservation_id)) {
      throw Conflict('Table is already booked for this date and time');
    }
    if (guests_count !== undefined) {
      const table = await svcGet<TableSummary>(`${CATALOG_URL}/internal/tables/${r.table_id}`);
      if (guests_count > table.capacity) throw BadRequest(`Table capacity is ${table.capacity}`);
      r.guests_count = guests_count;
    }
    if (reservation_date !== undefined) r.reservation_date = reservation_date;
    if (reservation_time !== undefined) r.reservation_time = reservation_time;
    await repo.save(r);
    res.json(await serialize(r));
  }));

  api.delete('/reservations/:id', authMiddleware, asyncHandler(async (req, res) => {
    const repo = AppDataSource.getRepository(Reservation);
    const r = await repo.findOne({ where: { reservation_id: Number(req.params.id) } });
    if (!r) throw NotFound('Reservation not found');
    if (r.user_id !== req.user!.user_id) throw Forbidden();
    r.status = 'cancelled';
    await repo.save(r);
    // асинхронное событие: бронь отменена
    await publishEvent('reservation.cancelled', {
      reservation_id: r.reservation_id, user_id: r.user_id, restaurant_id: r.restaurant_id,
      reservation_date: r.reservation_date, reservation_time: r.reservation_time,
    });
    res.status(204).send();
  }));

  api.get('/users/me/reservations', authMiddleware, asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20));
    const qb = AppDataSource.getRepository(Reservation).createQueryBuilder('r').where('r.user_id = :uid', { uid: req.user!.user_id });
    if (status) qb.andWhere('r.status = :s', { s: status });
    qb.orderBy('r.reservation_date', 'DESC').addOrderBy('r.reservation_time', 'DESC').skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    const data = await Promise.all(rows.map(serialize));
    res.json({ data, total, page, limit });
  }));

  app.use('/api/v1', api);

  // ── внутренний API ─────────────────────────────────────────────
  const internal = express.Router();
  internal.use(internalKeyMiddleware);
  internal.get('/tables/:id/availability', asyncHandler(async (req, res) => {
    const table_id = Number(req.params.id);
    const date = String(req.query.date ?? '');
    const time = String(req.query.time ?? '');
    if (!DATE_RE.test(date) || !TIME_RE.test(time)) throw BadRequest('date (YYYY-MM-DD) and time (HH:MM) are required');
    res.json({ table_id, date, time, available: !(await isTaken(table_id, date, time)) });
  }));
  internal.post('/reservations/availability-batch', asyncHandler(async (req, res) => {
    const { table_ids, date, time } = req.body || {};
    if (!Array.isArray(table_ids) || !DATE_RE.test(String(date)) || !TIME_RE.test(String(time))) throw BadRequest('table_ids[], date, time are required');
    const taken = await AppDataSource.getRepository(Reservation).createQueryBuilder('r')
      .select('DISTINCT r.table_id', 'table_id')
      .where('r.reservation_date = :d AND r.reservation_time = :t', { d: date, t: time })
      .andWhere('r.status IN (:...st)', { st: ['pending', 'confirmed'] })
      .andWhere('r.table_id IN (:...ids)', { ids: table_ids.length ? table_ids : [-1] })
      .getRawMany<{ table_id: number }>();
    const takenSet = new Set(taken.map((x) => Number(x.table_id)));
    res.json((table_ids as number[]).map((id) => ({ table_id: id, available: !takenSet.has(id) })));
  }));
  app.use('/internal', internal);

  app.use((_req, _res, next) => next(NotFound('Endpoint not found')));
  app.use(errorHandler);
  app.listen(PORT, () => console.log(`[reservation-service] listening on :${PORT}`));
}

main().catch((e) => { console.error('[reservation-service] fatal', e); process.exit(1); });
