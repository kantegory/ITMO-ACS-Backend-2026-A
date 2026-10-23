import cors from "cors";
import express, { Request, Response } from "express";
import { createEvent } from "../common/events";
import { connectRabbit, publishJson } from "../common/rabbitmq";

interface Reservation {
  reservation_id: number;
  user_id: number;
  restaurant_id: number;
  table_id: number;
  reservation_datetime: string;
  guest_count: number;
  status: "confirmed" | "cancelled";
}

const app = express();
const PORT = Number(process.env.RESERVATION_PORT) || 4101;

const reservations: Reservation[] = [];

app.use(cors());
app.use(express.json());

const start = async (): Promise<void> => {
  const { channel } = await connectRabbit();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ service: "reservation-service", status: "ok", broker: "rabbitmq" });
  });

  app.post("/reservations", (req: Request, res: Response) => {
    const { user_id, restaurant_id, table_id, reservation_datetime, guest_count } = req.body;

    if (!user_id || !restaurant_id || !table_id || !reservation_datetime || !guest_count) {
      return res.status(400).json({ error: { code: 400, message: "Некорректные данные" } });
    }

    const reservation: Reservation = {
      reservation_id: reservations.length + 1,
      user_id: Number(user_id),
      restaurant_id: Number(restaurant_id),
      table_id: Number(table_id),
      reservation_datetime,
      guest_count: Number(guest_count),
      status: "confirmed"
    };

    reservations.push(reservation);

    const event = createEvent("reservation.created", reservation);
    publishJson(channel, event.event_type, event);

    return res.status(201).json({
      message: "Бронирование создано, событие отправлено в RabbitMQ",
      reservation,
      event
    });
  });

  app.delete("/reservations/:id", (req: Request, res: Response) => {
    const reservation = reservations.find((item) => item.reservation_id === Number(req.params.id));

    if (!reservation) {
      return res.status(404).json({ error: { code: 404, message: "Бронирование не найдено" } });
    }

    reservation.status = "cancelled";

    const event = createEvent("reservation.cancelled", {
      reservation_id: reservation.reservation_id,
      user_id: reservation.user_id,
      status: "cancelled"
    });
    publishJson(channel, event.event_type, event);

    return res.json({
      message: "Бронирование отменено, событие отправлено в RabbitMQ",
      reservation,
      event
    });
  });

  app.get("/reservations", (_req: Request, res: Response) => {
    res.json(reservations);
  });

  app.listen(PORT, () => {
    console.log(`Reservation Service started on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Reservation Service failed to start", err);
  process.exit(1);
});
