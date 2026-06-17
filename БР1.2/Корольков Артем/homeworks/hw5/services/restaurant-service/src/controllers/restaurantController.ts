import type { Request, Response } from 'express';
import { Op } from 'sequelize';
import { MenuItem, Restaurant, RestaurantPhoto, Review } from '../models';

export async function getAll(req: Request, res: Response) {
  const { cuisine, city, priceMin, priceMax, q, search, sortBy, sortOrder, page: pageQ, pageSize: pageSizeQ } = req.query;
  const andParts: Record<string, unknown>[] = [];

  if (cuisine) andParts.push({ cuisine });
  if (city) andParts.push({ city });
  if (priceMin || priceMax) {
    const range: Record<symbol, number> = {} as Record<symbol, number>;
    if (priceMin) range[Op.gte] = Number(priceMin);
    if (priceMax) range[Op.lte] = Number(priceMax);
    andParts.push({ average_check: range });
  }

  const searchText = String(q || search || '').trim();
  if (searchText) {
    const clean = searchText.replace(/[%_]/g, '');
    if (clean) {
      const term = `%${clean}%`;
      andParts.push({
        [Op.or]: [{ name: { [Op.like]: term } }, { description: { [Op.like]: term } }, { address: { [Op.like]: term } }]
      });
    }
  }

  const where = andParts.length ? { [Op.and]: andParts } : {};
  const allowedSort = ['id', 'name', 'city', 'cuisine', 'average_check'];
  const sortCol = allowedSort.includes(String(sortBy)) ? String(sortBy) : 'id';
  const dir = String(sortOrder || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const page = Math.max(1, parseInt(String(pageQ || ''), 10) || 1);
  const rawSize = parseInt(String(pageSizeQ || ''), 10) || 10;
  const pageSize = Math.min(50, Math.max(1, rawSize));
  const offset = (page - 1) * pageSize;

  const { rows, count } = await Restaurant.findAndCountAll({
    where,
    attributes: ['id', 'name', 'cuisine', 'city', 'address', 'average_check'],
    order: [[sortCol, dir]],
    limit: pageSize,
    offset
  });

  const totalPages = count === 0 ? 0 : Math.ceil(count / pageSize);
  return res.json({ items: rows, page, pageSize, total: count, totalPages });
}

export async function getById(req: Request, res: Response) {
  const restaurantId = String(req.params.id);
  const restaurant = await Restaurant.findByPk(restaurantId, {
    include: [
      { model: MenuItem, attributes: ['id', 'name', 'price'] },
      { model: RestaurantPhoto, attributes: ['id', 'url'] },
      {
        model: Review,
        attributes: ['id', 'UserId', 'author_name', 'rating', 'text', 'createdAt']
      }
    ]
  });

  if (!restaurant) return res.status(404).json({ error: 'restaurant not found' });

  const json = restaurant.toJSON() as Record<string, unknown>;
  const reviews = (json.Reviews as Array<Record<string, unknown>>) || [];
  json.Reviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt,
    User: { id: r.UserId, name: r.author_name }
  }));

  return res.json(json);
}
