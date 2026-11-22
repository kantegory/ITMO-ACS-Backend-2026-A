import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Review } from '../entities/Review';
import { Restaurant } from '../entities/Restaurant';
import {
  BadRequest,
  Conflict,
  Forbidden,
  NotFound,
} from '../utils/errors';
import { serializeReview } from '../utils/serializers';

const parseId = (raw: unknown): number => {
  const id = parseInt(String(raw), 10);
  if (!Number.isFinite(id) || id < 1) throw BadRequest('Invalid id');
  return id;
};

export const create = async (req: Request, res: Response) => {
  const { restaurant_id, rating, comment } = req.body ?? {};

  const details: { field: string; message: string }[] = [];
  if (!Number.isFinite(restaurant_id))
    details.push({ field: 'restaurant_id', message: 'Required' });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5)
    details.push({ field: 'rating', message: 'Must be between 1 and 5' });
  if (comment !== undefined && comment !== null && typeof comment !== 'string')
    details.push({ field: 'comment', message: 'Must be a string' });
  if (typeof comment === 'string' && comment.length > 1000)
    details.push({ field: 'comment', message: 'Max 1000 characters' });
  if (details.length) throw BadRequest('Validation failed', details);

  const restRepo = AppDataSource.getRepository(Restaurant);
  if (!(await restRepo.findOne({ where: { restaurant_id } })))
    throw NotFound('Restaurant not found');

  const repo = AppDataSource.getRepository(Review);
  const exists = await repo.findOne({
    where: { restaurant_id, user_id: req.user!.user_id },
  });
  if (exists) throw Conflict('You have already reviewed this restaurant');

  const review = repo.create({
    user_id: req.user!.user_id,
    restaurant_id,
    rating,
    comment: comment ?? null,
  });
  await repo.save(review);

  const saved = await repo.findOne({
    where: { review_id: review.review_id },
    relations: ['user'],
  });
  res.status(201).json(serializeReview(saved!));
};

export const update = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const repo = AppDataSource.getRepository(Review);
  const review = await repo.findOne({
    where: { review_id: id },
    relations: ['user'],
  });
  if (!review) throw NotFound('Review not found');
  if (review.user_id !== req.user!.user_id) throw Forbidden();

  const { rating, comment } = req.body ?? {};
  const details: { field: string; message: string }[] = [];
  if (rating !== undefined && (!Number.isFinite(rating) || rating < 1 || rating > 5))
    details.push({ field: 'rating', message: 'Must be between 1 and 5' });
  if (comment !== undefined && comment !== null && typeof comment !== 'string')
    details.push({ field: 'comment', message: 'Must be a string' });
  if (typeof comment === 'string' && comment.length > 1000)
    details.push({ field: 'comment', message: 'Max 1000 characters' });
  if (details.length) throw BadRequest('Validation failed', details);

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await repo.save(review);
  res.json(serializeReview(review));
};

export const remove = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const repo = AppDataSource.getRepository(Review);
  const review = await repo.findOne({ where: { review_id: id } });
  if (!review) throw NotFound('Review not found');
  if (review.user_id !== req.user!.user_id) throw Forbidden();
  await repo.remove(review);
  res.status(204).send();
};
