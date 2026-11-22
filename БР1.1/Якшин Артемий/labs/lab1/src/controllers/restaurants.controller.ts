import { Request, Response } from 'express';
import { Like } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Restaurant } from '../entities/Restaurant';
import { RestaurantPhoto } from '../entities/RestaurantPhoto';
import { MenuItem } from '../entities/MenuItem';
import { Review } from '../entities/Review';
import { BadRequest, NotFound } from '../utils/errors';
import {
  serializeRestaurant,
  serializeRestaurantDetail,
  serializePhoto,
  serializeMenuItem,
  serializeReview,
} from '../utils/serializers';
import { getStatsForRestaurants } from '../utils/restaurant-stats';

const parseId = (raw: unknown): number => {
  const id = parseInt(String(raw), 10);
  if (!Number.isFinite(id) || id < 1) throw BadRequest('Invalid id');
  return id;
};

export const list = async (req: Request, res: Response) => {
  const { city, cuisine_id, price_level, search } = req.query;
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20),
  );

  const repo = AppDataSource.getRepository(Restaurant);
  const qb = repo
    .createQueryBuilder('r')
    .leftJoinAndSelect('r.cuisines', 'c');

  if (city) qb.andWhere('r.city = :city', { city });
  if (price_level) qb.andWhere('r.price_level = :pl', { pl: price_level });
  if (search) qb.andWhere('r.name LIKE :q', { q: `%${search}%` });
  if (cuisine_id) {
    const subRestaurantIds = AppDataSource
      .createQueryBuilder()
      .select('rc.restaurant_id')
      .from('restaurant_cuisines', 'rc')
      .where('rc.cuisine_id = :cid', { cid: Number(cuisine_id) });
    qb.andWhere(`r.restaurant_id IN (${subRestaurantIds.getQuery()})`)
      .setParameters(subRestaurantIds.getParameters());
  }

  qb.orderBy('r.restaurant_id', 'ASC').skip((page - 1) * limit).take(limit);

  const [rows, total] = await qb.getManyAndCount();
  const stats = await getStatsForRestaurants(rows.map((r) => r.restaurant_id));
  res.json({
    data: rows.map((r) => serializeRestaurant(r, stats.get(r.restaurant_id))),
    total,
    page,
    limit,
  });
};

export const getById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const repo = AppDataSource.getRepository(Restaurant);
  const r = await repo.findOne({
    where: { restaurant_id: id },
    relations: ['cuisines', 'photos', 'menu_items'],
  });
  if (!r) throw NotFound('Restaurant not found');
  const stats = await getStatsForRestaurants([id]);
  res.json(serializeRestaurantDetail(r, stats.get(id)));
};

export const getPhotos = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const restRepo = AppDataSource.getRepository(Restaurant);
  if (!(await restRepo.findOne({ where: { restaurant_id: id } })))
    throw NotFound('Restaurant not found');
  const photos = await AppDataSource.getRepository(RestaurantPhoto).find({
    where: { restaurant_id: id },
  });
  res.json(photos.map(serializePhoto));
};

export const getMenu = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const restRepo = AppDataSource.getRepository(Restaurant);
  if (!(await restRepo.findOne({ where: { restaurant_id: id } })))
    throw NotFound('Restaurant not found');

  const where: Record<string, unknown> = { restaurant_id: id };
  if (req.query.category) where.category = Like(`%${req.query.category}%`);

  const items = await AppDataSource.getRepository(MenuItem).find({ where });
  res.json(items.map(serializeMenuItem));
};

export const getReviews = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const restRepo = AppDataSource.getRepository(Restaurant);
  if (!(await restRepo.findOne({ where: { restaurant_id: id } })))
    throw NotFound('Restaurant not found');

  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt((req.query.limit as string) ?? '10', 10) || 10),
  );

  const reviewRepo = AppDataSource.getRepository(Review);
  const [rows, total] = await reviewRepo.findAndCount({
    where: { restaurant_id: id },
    relations: ['user'],
    order: { created_at: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const avgRow = await reviewRepo
    .createQueryBuilder('r')
    .select('AVG(r.rating)', 'avg')
    .where('r.restaurant_id = :id', { id })
    .getRawOne<{ avg: string | null }>();

  res.json({
    data: rows.map(serializeReview),
    total,
    average_rating: avgRow?.avg ? Number(Number(avgRow.avg).toFixed(2)) : 0,
    page,
    limit,
  });
};
