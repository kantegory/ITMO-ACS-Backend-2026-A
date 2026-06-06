import cors from "cors";
import express, { Request, Response } from "express";
import { createEvent } from "../../common/events";
import { created, error, ok, parseJsonResponse } from "../../common/http";
import { connectRabbit, publishJson } from "../../common/rabbitmq";

interface Table {
  id: number;
  capacity: number;
}

interface Reservation {
  id: number;
  user_id: number;
  restaurant_id: number;
  table_id: number;
  reservation_datetime: string;
  guest_count: number;
  status: "confirmed" | "cancelled";
}

const app = express();
const PORT = Number(process.env.PORT) || 4004;
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://restaurants:4002";
const TABLE_SERVICE_URL = process.env.TABLE_SERVICE_URL || "http://tables:4003";

const reservations: Reservation[] = [];

const getUserId = (req: Request): number | null => {
  const id = Number(req.header("Authorization")?.replace("Bearer user-", ""));
  return Number.isInteger(id) && id > 0 ? id : null;
};

app.use(cors());
app.use(express.json());

const start = async (): Promise<void> => {
  const channel = await connectRabbit();

  app.get("/health", (_req: Request, res: Response) => ok(res, { service: "reservations", status: "ok" }));

  app.get("/reservations/my", (req: Request, res: Response) => {
    const userId = getUserId(req);
    return userId
      ? ok(res, reservations.filter((item) => item.user_id === userId))
      : error(res, 401, "Пользователь не авторизован");
  });

  app.post("/reservations", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { restaurant_id, table_id, reservation_datetime, guest_count } = req.body;

    if (!userId) {
      return error(res, 401, "Пользователь не авторизован");
    }

    if (!restaurant_id || !table_id || !reservation_datetime || !guest_count) {
      return error(res, 400, "Некорректные данные");
    }

    const restaurantResponse = await fetch(`${RESTAURANT_SERVICE_URL}/internal/restaurants/${restaurant_id}`);
    if (!restaurantResponse.ok) {
      return error(res, 404, "Ресторан не найден");
    }

    const tableResponse = await fetch(`${TABLE_SERVICE_URL}/internal/restaurants/${restaurant_id}/tables/${table_id}`);
    if (!tableResponse.ok) {
      return error(res, 404, "Столик не найден");
    }

    const table = await parseJsonResponse<Table>(tableResponse);
    if (Number(guest_count) > table.capacity) {
      return error(res, 400, "Количество гостей превышает вместимость столика");
    }

    const busy = reservations.some(
      (item) =>
        item.table_id === Number(table_id) &&
        item.reservation_datetime === reservation_datetime &&
        item.status === "confirmed"
    );
    if (busy) {
      return error(res, 409, "Столик уже забронирован");
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
    publishJson(channel, "reservation.created", createEvent("reservation.created", {
      reservation_id: reservation.id,
      user_id: reservation.user_id,
      restaurant_id: reservation.restaurant_id,
      table_id: reservation.table_id,
      reservation_datetime: reservation.reservation_datetime,
      guest_count: reservation.guest_count,
      status: reservation.status
    }));

    return created(res, { message: "Бронирование создано", reservation });
  });

  app.delete("/reservations/:id", (req: Request, res: Response) => {
    const userId = getUserId(req);
    const reservation = reservations.find((item) => item.id === Number(req.params.id));

    if (!userId) {
      return error(res, 401, "Пользователь не авторизован");
    }

    if (!reservation) {
      return error(res, 404, "Бронирование не найдено");
    }

    if (reservation.user_id !== userId) {
      return error(res, 403, "Нельзя отменить чужое бронирование");
    }

    reservation.status = "cancelled";
    publishJson(channel, "reservation.cancelled", createEvent("reservation.cancelled", {
      reservation_id: reservation.id,
      user_id: reservation.user_id,
      status: "cancelled"
    }));

    return ok(res, { message: "Бронирование отменено" });
  });

  app.listen(PORT, () => console.log(`Reservation Service started on ${PORT}`));
};

start().catch((err) => {
  console.error("Reservation Service failed to start", err);
  process.exit(1);
});
