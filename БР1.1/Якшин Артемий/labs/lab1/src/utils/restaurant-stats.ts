import { AppDataSource } from '../config/data-source';
import { Review } from '../entities/Review';
import { RestaurantPhoto } from '../entities/RestaurantPhoto';
import { RestaurantStats } from './serializers';

export const getStatsForRestaurants = async (
  restaurantIds: number[],
): Promise<Map<number, RestaurantStats>> => {
  const result = new Map<number, RestaurantStats>();
  if (restaurantIds.length === 0) return result;

  const reviewRepo = AppDataSource.getRepository(Review);
  const photoRepo = AppDataSource.getRepository(RestaurantPhoto);

  const reviewRows = await reviewRepo
    .createQueryBuilder('r')
    .select('r.restaurant_id', 'restaurant_id')
    .addSelect('AVG(r.rating)', 'avg_rating')
    .addSelect('COUNT(r.review_id)', 'cnt')
    .where('r.restaurant_id IN (:...ids)', { ids: restaurantIds })
    .groupBy('r.restaurant_id')
    .getRawMany<{ restaurant_id: number; avg_rating: string; cnt: string }>();

  for (const row of reviewRows) {
    result.set(Number(row.restaurant_id), {
      average_rating: row.avg_rating ? Number(Number(row.avg_rating).toFixed(2)) : 0,
      reviews_count: Number(row.cnt),
    });
  }

  const photos = await photoRepo
    .createQueryBuilder('p')
    .where('p.restaurant_id IN (:...ids)', { ids: restaurantIds })
    .orderBy('p.is_main', 'DESC')
    .addOrderBy('p.photo_id', 'ASC')
    .getMany();

  const seen = new Set<number>();
  for (const p of photos) {
    if (!seen.has(p.restaurant_id)) {
      seen.add(p.restaurant_id);
      const cur = result.get(p.restaurant_id) ?? {};
      cur.main_photo = p.photo_url;
      result.set(p.restaurant_id, cur);
    }
  }

  for (const id of restaurantIds) {
    if (!result.has(id)) {
      result.set(id, { average_rating: 0, reviews_count: 0, main_photo: null });
    } else {
      const s = result.get(id)!;
      s.average_rating = s.average_rating ?? 0;
      s.reviews_count = s.reviews_count ?? 0;
      s.main_photo = s.main_photo ?? null;
    }
  }
  return result;
};
