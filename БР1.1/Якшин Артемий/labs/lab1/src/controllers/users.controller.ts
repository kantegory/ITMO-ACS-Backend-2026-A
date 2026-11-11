import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Reservation } from '../entities/Reservation';
import { BadRequest, NotFound } from '../utils/errors';
import { serializeUser, serializeReservation } from '../utils/serializers';

const PHONE_RE = /^\+7\d{10}$/;

export const getMe = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { user_id: req.user!.user_id } });
  if (!user) throw NotFound('User not found');
  res.json(serializeUser(user));
};

export const updateMe = async (req: Request, res: Response) => {
  const { name, phone, password } = req.body ?? {};
  const details: { field: string; message: string }[] = [];
  if (name !== undefined && (typeof name !== 'string' || name.length < 2 || name.length > 100))
    details.push({ field: 'name', message: 'Must be 2-100 characters' });
  if (phone !== undefined && phone !== null && !PHONE_RE.test(phone))
    details.push({ field: 'phone', message: 'Must match +7XXXXXXXXXX' });
  if (password !== undefined && (password.length < 8 || password.length > 64))
    details.push({ field: 'password', message: 'Must be 8-64 characters' });
  if (details.length) throw BadRequest('Validation failed', details);

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { user_id: req.user!.user_id } });
  if (!user) throw NotFound('User not found');

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (password !== undefined) user.password_hash = await bcrypt.hash(password, 10);
  await repo.save(user);
  res.json(serializeUser(user));
};

export const getMyReservations = async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20),
  );

  const repo = AppDataSource.getRepository(Reservation);
  const qb = repo
    .createQueryBuilder('r')
    .leftJoinAndSelect('r.table', 't')
    .leftJoinAndSelect('t.restaurant', 'rest')
    .leftJoinAndSelect('rest.cuisines', 'c')
    .where('r.user_id = :uid', { uid: req.user!.user_id });
  if (status) qb.andWhere('r.status = :s', { s: status });
  qb.orderBy('r.reservation_date', 'DESC').addOrderBy('r.reservation_time', 'DESC');
  qb.skip((page - 1) * limit).take(limit);

  const [data, total] = await qb.getManyAndCount();
  res.json({ data: data.map(serializeReservation), total, page, limit });
};
