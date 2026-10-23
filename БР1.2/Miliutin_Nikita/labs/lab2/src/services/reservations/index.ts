import cors from "cors";
import express, { Request, Response } from "express";
import { created, error, ok, parseJsonResponse } from "../../common/http";
import { Reservation, RestaurantTable } from "../../common/types";

const app = express();
const PORT = Number(process.env.RESERVATION_PORT) || 4004;
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://localhost:4002";
const TABLE_SERVICE_URL = process.env.TABLE_SERVICE_URL || "http://localhost:4003";

const reservations: Reservation[] = [
  {
    id: 1,
    user_id: 1,
    restaurant_id: 1,
    table_id: 2,
    reservation_datetime: "2026-04-05T19:00:00.000Z",
    guest_count: 4,
    status: "confirmed"
  }
];

app.use(cors());
app.use(express.json());

const getUserId = (req: Request): number | null => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  const userId = Number(token?.replace("user-", ""));
  return Number.isInteger(userId) && userId > 0 ? userId : null;
};

app.get("/health", (_req: Request, res: Response) => ok(res, { service: "reservations", status: "ok" }));

app.get("/reservations/my", (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return error(res, 401, "Пользователь не авторизован");
  }

  return ok(
    res,
    reservations.filter((reservation) => reservation.user_id === userId)
  );
});

app.get("/internal/tables/:tableId/availability", (req: Request, res: Response) => {
  const isBusy = reservations.some(
    (reservation) =>
      reservation.table_id === Number(req.params.tableId) &&
      reservation.reservation_datetime === req.query.reservation_datetime &&
      reservation.status === "confirmed"
  );

  return ok(res, { available: !isBusy });
});

app.post("/reservations", async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return error(res, 401, "Пользователь не авторизован");
  }

  const { restaurant_id, table_id, reservation_datetime, guest_count } = req.body;

  if (!restaurant_id || !table_id || !reservation_datetime || !guest_count) {
    return error(res, 400, "Некорректные данные");
  }

  const restaurantResponse = await fetch(`${RESTAURANT_SERVICE_URL}/internal/restaurants/${restaurant_id}`);
  if (!restaurantResponse.ok) {
    return error(res, restaurantResponse.status, "Ресторан не найден");
  }

  const tableResponse = await fetch(
    `${TABLE_SERVICE_URL}/internal/restaurants/${restaurant_id}/tables/${table_id}`
  );
  if (!tableResponse.ok) {
    return error(res, tableResponse.status, "Столик не найден");
  }

  const table = await parseJsonResponse<RestaurantTable>(tableResponse);
  if (Number(guest_count) > table.capacity) {
    return error(res, 400, "Количество гостей превышает вместимость столика");
  }

  const isBusy = reservations.some(
    (reservation) =>
      reservation.table_id === Number(table_id) &&
      reservation.reservation_datetime === reservation_datetime &&
      reservation.status === "confirmed"
  );

  if (isBusy) {
    return error(res, 409, "Столик уже забронирован на выбранное время");
  }

  const reservation: Reservation = {
    id: reservations.length + 1,
    user_id: userId,
    restaurant_id: Number(restaurant_id),
    table_id: Number(table_id),
    reservation_datetime,
    guest_count: Number(guest_count),
    status: "confirmed"
  };

  reservations.push(reservation);
  console.log("event: reservation.created", reservation);

  return created(res, {
    message: "Бронирование создано",
    reservation
  });
});

app.delete("/reservations/:id", (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return error(res, 401, "Пользователь не авторизован");
  }

  const reservation = reservations.find((item) => item.id === Number(req.params.id));

  if (!reservation) {
    return error(res, 404, "Бронирование не найдено");
  }

  if (reservation.user_id !== userId) {
    return error(res, 403, "Нельзя отменить чужое бронирование");
  }

  reservation.status = "cancelled";
  console.log("event: reservation.cancelled", reservation);

  return ok(res, { message: "Бронирование отменено" });
});

app.listen(PORT, () => console.log(`Reservation Service started on http://localhost:${PORT}`));
