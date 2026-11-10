import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Restaurant } from '../entities/Restaurant';
import { RestaurantTable } from '../entities/RestaurantTable';
import { Reservation } from '../entities/Reservation';
import { BadRequest, NotFound } from '../utils/errors';
import { serializeTable } from '../utils/serializers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export const listAvailable = async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) throw BadRequest('Invalid restaurant id');

  const date = String(req.query.date ?? '');
  const time = String(req.query.time ?? '');
  const guests = req.query.guests ? parseInt(String(req.query.guests), 10) : undefined;

  if (!DATE_RE.test(date)) throw BadRequest('date must be YYYY-MM-DD');
  if (!TIME_RE.test(time)) throw BadRequest('time must be HH:MM');
  if (guests !== undefined && (!Number.isFinite(guests) || guests < 1))
    throw BadRequest('guests must be >= 1');

  const restRepo = AppDataSource.getRepository(Restaurant);
  if (!(await restRepo.findOne({ where: { restaurant_id: id } })))
    throw NotFound('Restaurant not found');

  const tableRepo = AppDataSource.getRepository(RestaurantTable);
  const qb = tableRepo
    .createQueryBuilder('t')
    .where('t.restaurant_id = :id', { id });
  if (guests !== undefined) qb.andWhere('t.capacity >= :g', { g: guests });
  const tables = await qb.getMany();

  const reservedIds = await AppDataSource.getRepository(Reservation)
    .createQueryBuilder('r')
    .select('r.table_id', 'table_id')
    .where('r.reservation_date = :d AND r.reservation_time = :t', { d: date, t: time })
    .andWhere('r.status IN (:...st)', { st: ['pending', 'confirmed'] })
    .getRawMany<{ table_id: number }>();

  const reserved = new Set(reservedIds.map((r) => Number(r.table_id)));

  const result = tables.map((t) => ({
    ...serializeTable(t),
    status: reserved.has(t.table_id) ? 'reserved' : 'available',
  }));
  res.json(result);
};
