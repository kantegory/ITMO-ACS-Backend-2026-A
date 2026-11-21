import { Op } from 'sequelize';
import Reservation from '../models/Reservation';

type Query = Record<string, unknown>;

function parsePagination(query: Query) {
  const page = Math.max(1, parseInt(String(query.page ?? ''), 10) || 1);
  const rawSize = parseInt(String(query.pageSize ?? ''), 10) || 10;
  const pageSize = Math.min(50, Math.max(1, rawSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export async function listReservationsForUser(userId: number, query: Query) {
  const { page, pageSize, offset } = parsePagination(query);
  const sortOrder = String(query.sortOrder ?? 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const allowedSort = ['reservation_datetime', 'createdAt', 'status'];
  const candidateSort = String(query.sortBy ?? '');
  const sortBy = allowedSort.includes(candidateSort) ? candidateSort : 'reservation_datetime';

  const where: Record<string, unknown> = { UserId: userId };
  const q = String(query.q ?? query.search ?? '').trim();
  if (q) {
    const clean = q.replace(/[%_]/g, '');
    if (clean) where.restaurant_name = { [Op.like]: `%${clean}%` };
  }

  const { rows, count } = await Reservation.findAndCountAll({
    where,
    order: [[sortBy, sortOrder]],
    limit: pageSize,
    offset
  });

  const totalPages = count === 0 ? 0 : Math.ceil(count / pageSize);
  const items = rows.map((row) => {
    const plain = row.toJSON() as Record<string, unknown>;
    return {
      ...plain,
      Restaurant: {
        id: plain.RestaurantId,
        name: plain.restaurant_name,
        city: plain.restaurant_city,
        cuisine: plain.restaurant_cuisine,
        average_check: plain.restaurant_average_check
      }
    };
  });

  return { items, page, pageSize, total: count, totalPages };
}
