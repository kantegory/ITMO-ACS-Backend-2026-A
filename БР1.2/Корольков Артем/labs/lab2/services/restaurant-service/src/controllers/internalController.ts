import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Restaurant } from '../models';

export async function getRestaurantById(req: Request, res: Response) {
  const restaurant = await Restaurant.findByPk(req.params.id, {
    attributes: ['id', 'name', 'city', 'cuisine', 'average_check']
  });
  if (!restaurant) return res.status(404).json({ error: 'restaurant not found' });
  return res.json(restaurant);
}

export async function getRestaurantsBatch(req: Request, res: Response) {
  const idsRaw = String(req.query.ids || '');
  const ids = idsRaw
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x) && x > 0);

  if (!ids.length) return res.status(400).json({ error: 'ids query parameter is required' });

  const rows = await Restaurant.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'name', 'city', 'cuisine', 'average_check']
  });
  return res.json({ items: rows });
}
