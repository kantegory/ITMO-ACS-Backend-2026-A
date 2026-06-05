import { RESTAURANT_SERVICE_URL } from '../../../shared/src/config';
import { serviceFetch } from '../../../shared/src/http';

export type RestaurantSnapshot = {
  id: number;
  name: string;
  city: string;
  cuisine: string;
  average_check: number;
};

export async function fetchRestaurant(id: number): Promise<RestaurantSnapshot | null> {
  const response = await serviceFetch(`${RESTAURANT_SERVICE_URL}/internal/restaurants/${id}`);
  if (!response.ok) return null;
  return (await response.json()) as RestaurantSnapshot;
}

export async function fetchRestaurantsBatch(ids: number[]): Promise<RestaurantSnapshot[]> {
  if (!ids.length) return [];
  const response = await serviceFetch(
    `${RESTAURANT_SERVICE_URL}/internal/restaurants/batch?ids=${ids.join(',')}`
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: RestaurantSnapshot[] };
  return payload.items ?? [];
}
