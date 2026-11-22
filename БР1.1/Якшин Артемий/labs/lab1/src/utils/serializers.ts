import { User } from '../entities/User';
import { Restaurant } from '../entities/Restaurant';
import { Cuisine } from '../entities/Cuisine';
import { RestaurantPhoto } from '../entities/RestaurantPhoto';
import { MenuItem } from '../entities/MenuItem';
import { RestaurantTable } from '../entities/RestaurantTable';
import { Reservation } from '../entities/Reservation';
import { Review } from '../entities/Review';

export const serializeUser = (u: User) => ({
  user_id: u.user_id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  created_at: u.created_at,
});

export const serializeCuisine = (c: Cuisine) => ({
  cuisine_id: c.cuisine_id,
  name: c.name,
});

export const serializePhoto = (p: RestaurantPhoto) => ({
  photo_id: p.photo_id,
  photo_url: p.photo_url,
});

export const serializeMenuItem = (m: MenuItem) => ({
  menu_item_id: m.menu_item_id,
  name: m.name,
  description: m.description,
  price: Number(m.price),
  category: m.category,
});

export const serializeTable = (t: RestaurantTable) => ({
  table_id: t.table_id,
  table_number: t.table_number,
  capacity: t.capacity,
  status: t.status,
});

export interface RestaurantStats {
  average_rating?: number;
  reviews_count?: number;
  main_photo?: string | null;
}

export const serializeRestaurant = (r: Restaurant, stats: RestaurantStats = {}) => ({
  restaurant_id: r.restaurant_id,
  name: r.name,
  description: r.description,
  address: r.address,
  city: r.city,
  price_level: r.price_level,
  opening_time: r.opening_time,
  closing_time: r.closing_time,
  phone: r.phone,
  cuisines: (r.cuisines ?? []).map(serializeCuisine),
  average_rating: stats.average_rating ?? 0,
  main_photo: stats.main_photo ?? null,
});

export const serializeRestaurantDetail = (
  r: Restaurant,
  stats: RestaurantStats = {},
) => ({
  ...serializeRestaurant(r, stats),
  photos: (r.photos ?? []).map(serializePhoto),
  menu_items: (r.menu_items ?? []).map(serializeMenuItem),
  reviews_count: stats.reviews_count ?? 0,
});

export const serializeReservation = (r: Reservation) => ({
  reservation_id: r.reservation_id,
  user_id: r.user_id,
  table: r.table ? serializeTable(r.table) : undefined,
  restaurant: r.table?.restaurant
    ? serializeRestaurant(r.table.restaurant)
    : undefined,
  reservation_date: r.reservation_date,
  reservation_time: r.reservation_time,
  guests_count: r.guests_count,
  status: r.status,
  created_at: r.created_at,
});

export const serializeReview = (r: Review) => ({
  review_id: r.review_id,
  user: r.user ? serializeUser(r.user) : undefined,
  restaurant_id: r.restaurant_id,
  rating: r.rating,
  comment: r.comment,
  created_at: r.created_at,
});
