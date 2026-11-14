import type { Request, Response } from 'express';
import Reservation from '../models/Reservation';
import { fetchRestaurant } from '../clients/restaurantClient';
import { listReservationsForUser } from '../helpers/reservationList';

async function createForRestaurant(
  userId: number,
  restaurantId: number,
  guests_count: unknown,
  reservation_datetime: unknown,
  res: Response
) {
  const restaurant = await fetchRestaurant(restaurantId);
  if (!restaurant) return res.status(404).json({ error: 'restaurant not found' });

  const reservation = await Reservation.create({
    UserId: userId,
    RestaurantId: restaurant.id,
    restaurant_name: restaurant.name,
    restaurant_city: restaurant.city,
    restaurant_cuisine: restaurant.cuisine,
    restaurant_average_check: restaurant.average_check,
    guests_count,
    reservation_datetime
  });
  return res.status(201).json(reservation);
}

export async function create(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'missing auth user' });
  const { restaurant_id, guests_count, reservation_datetime } = req.body as Record<string, unknown>;

  if (!restaurant_id || !guests_count || !reservation_datetime) {
    return res.status(400).json({ error: 'restaurant_id, guests_count and reservation_datetime are required' });
  }

  return createForRestaurant(req.user.id, Number(restaurant_id), guests_count, reservation_datetime, res);
}

export async function createFromRestaurant(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'missing auth user' });
  const { guests_count, reservation_datetime } = req.body as Record<string, unknown>;

  if (!guests_count || !reservation_datetime) {
    return res.status(400).json({ error: 'guests_count and reservation_datetime are required' });
  }

  return createForRestaurant(req.user.id, Number(req.params.id), guests_count, reservation_datetime, res);
}

export async function getAll(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'missing auth user' });
  const payload = await listReservationsForUser(req.user.id, req.query as Record<string, unknown>);
  return res.json(payload);
}

export async function myReservationHistory(req: Request, res: Response) {
  return getAll(req, res);
}
