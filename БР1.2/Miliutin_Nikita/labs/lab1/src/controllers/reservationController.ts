import { Response } from "express";
import { nextId, reservations, restaurants, tables } from "../data/store";
import { AuthenticatedRequest } from "../middleware/auth";
import { created, error, message, ok } from "../views/apiView";

export const createReservation = (req: AuthenticatedRequest, res: Response): Response => {
  if (!req.user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  const { restaurant_id, table_id, reservation_datetime, guest_count } = req.body;

  if (!restaurant_id || !table_id || !reservation_datetime || !guest_count) {
    return error(res, 400, "Некорректные данные");
  }

  const restaurant = restaurants.find((item) => item.restaurant_id === Number(restaurant_id));
  const table = tables.find((item) => item.table_id === Number(table_id));

  if (!restaurant || !table || table.restaurant_id !== restaurant.restaurant_id || !table.is_active) {
    return error(res, 404, "Ресторан или столик не найдены");
  }

  if (Number(guest_count) > table.capacity) {
    return error(res, 400, "Количество гостей превышает вместимость столика");
  }

  const isBusy = reservations.some(
    (reservation) =>
      reservation.table_id === table.table_id &&
      reservation.reservation_datetime === reservation_datetime &&
      reservation.status === "confirmed"
  );

  if (isBusy) {
    return error(res, 409, "Столик уже забронирован на выбранное время");
  }

  const reservation = {
    reservation_id: nextId(reservations, "reservation_id"),
    user_id: req.user.user_id,
    restaurant_id: restaurant.restaurant_id,
    table_id: table.table_id,
    reservation_datetime,
    guest_count: Number(guest_count),
    status: "confirmed" as const,
    created_at: new Date().toISOString()
  };

  reservations.push(reservation);
  return created(res, {
    message: "Бронирование создано",
    reservation
  });
};

export const listMyReservations = (req: AuthenticatedRequest, res: Response): Response => {
  if (!req.user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  return ok(res, reservations.filter((reservation) => reservation.user_id === req.user?.user_id));
};

export const cancelReservation = (req: AuthenticatedRequest, res: Response): Response => {
  if (!req.user) {
    return error(res, 401, "Пользователь не авторизован");
  }

  const reservation = reservations.find((item) => item.reservation_id === Number(req.params.id));

  if (!reservation) {
    return error(res, 404, "Бронирование не найдено");
  }

  if (reservation.user_id !== req.user.user_id) {
    return error(res, 403, "Нельзя отменить чужое бронирование");
  }

  reservation.status = "cancelled";
  return message(res, "Бронирование отменено");
};
