import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Reservation } from '../entities/Reservation';
import { RestaurantTable } from '../entities/RestaurantTable';
import {
  BadRequest,
  Conflict,
  Forbidden,
  NotFound,
} from '../utils/errors';
import { serializeReservation } from '../utils/serializers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

const parseId = (raw: unknown): number => {
  const id = parseInt(String(raw), 10);
  if (!Number.isFinite(id) || id < 1) throw BadRequest('Invalid id');
  return id;
};

const loadReservation = async (id: number) => {
  return AppDataSource.getRepository(Reservation).findOne({
    where: { reservation_id: id },
    relations: ['table', 'table.restaurant', 'table.restaurant.cuisines'],
  });
};

const isTableTaken = async (
  table_id: number,
  date: string,
  time: string,
  excludeId?: number,
) => {
  const qb = AppDataSource.getRepository(Reservation)
    .createQueryBuilder('r')
    .where('r.table_id = :tid', { tid: table_id })
    .andWhere('r.reservation_date = :d AND r.reservation_time = :t', { d: date, t: time })
    .andWhere('r.status IN (:...st)', { st: ['pending', 'confirmed'] });
  if (excludeId) qb.andWhere('r.reservation_id != :eid', { eid: excludeId });
  return (await qb.getCount()) > 0;
};

export const create = async (req: Request, res: Response) => {
  const { table_id, reservation_date, reservation_time, guests_count } = req.body ?? {};

  const details: { field: string; message: string }[] = [];
  if (!Number.isFinite(table_id))
    details.push({ field: 'table_id', message: 'Required' });
  if (!reservation_date || !DATE_RE.test(reservation_date))
    details.push({ field: 'reservation_date', message: 'Must be YYYY-MM-DD' });
  if (!reservation_time || !TIME_RE.test(reservation_time))
    details.push({ field: 'reservation_time', message: 'Must be HH:MM' });
  if (!Number.isFinite(guests_count) || guests_count < 1)
    details.push({ field: 'guests_count', message: 'Must be >= 1' });
  if (details.length) throw BadRequest('Validation failed', details);

  const tableRepo = AppDataSource.getRepository(RestaurantTable);
  const table = await tableRepo.findOne({ where: { table_id } });
  if (!table) throw NotFound('Table not found');
  if (guests_count > table.capacity)
    throw BadRequest(`Table capacity is ${table.capacity}`);

  if (await isTableTaken(table_id, reservation_date, reservation_time)) {
    throw Conflict('Table is already booked for this date and time');
  }

  const repo = AppDataSource.getRepository(Reservation);
  const r = repo.create({
    user_id: req.user!.user_id,
    table_id,
    reservation_date,
    reservation_time,
    guests_count,
    status: 'confirmed',
  });
  await repo.save(r);
  const saved = await loadReservation(r.reservation_id);
  res.status(201).json(serializeReservation(saved!));
};

export const getById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const r = await loadReservation(id);
  if (!r) throw NotFound('Reservation not found');
  if (r.user_id !== req.user!.user_id) throw Forbidden();
  res.json(serializeReservation(r));
};

export const update = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const repo = AppDataSource.getRepository(Reservation);
  const r = await repo.findOne({ where: { reservation_id: id }, relations: ['table'] });
  if (!r) throw NotFound('Reservation not found');
  if (r.user_id !== req.user!.user_id) throw Forbidden();

  const { reservation_date, reservation_time, guests_count } = req.body ?? {};
  const details: { field: string; message: string }[] = [];
  if (reservation_date !== undefined && !DATE_RE.test(reservation_date))
    details.push({ field: 'reservation_date', message: 'Must be YYYY-MM-DD' });
  if (reservation_time !== undefined && !TIME_RE.test(reservation_time))
    details.push({ field: 'reservation_time', message: 'Must be HH:MM' });
  if (guests_count !== undefined && (!Number.isFinite(guests_count) || guests_count < 1))
    details.push({ field: 'guests_count', message: 'Must be >= 1' });
  if (details.length) throw BadRequest('Validation failed', details);

  const newDate = reservation_date ?? r.reservation_date;
  const newTime = reservation_time ?? r.reservation_time;

  if (newDate !== r.reservation_date || newTime !== r.reservation_time) {
    if (await isTableTaken(r.table_id, newDate, newTime, r.reservation_id)) {
      throw Conflict('Table is already booked for this date and time');
    }
  }

  if (guests_count !== undefined && guests_count > r.table.capacity)
    throw BadRequest(`Table capacity is ${r.table.capacity}`);

  if (reservation_date !== undefined) r.reservation_date = reservation_date;
  if (reservation_time !== undefined) r.reservation_time = reservation_time;
  if (guests_count !== undefined) r.guests_count = guests_count;

  await repo.save(r);
  const saved = await loadReservation(r.reservation_id);
  res.json(serializeReservation(saved!));
};

export const cancel = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const repo = AppDataSource.getRepository(Reservation);
  const r = await repo.findOne({ where: { reservation_id: id } });
  if (!r) throw NotFound('Reservation not found');
  if (r.user_id !== req.user!.user_id) throw Forbidden();
  r.status = 'cancelled';
  await repo.save(r);
  res.status(204).send();
};
