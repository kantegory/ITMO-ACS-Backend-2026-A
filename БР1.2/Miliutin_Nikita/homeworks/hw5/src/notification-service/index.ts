import cors from "cors";
import express, { Request, Response } from "express";
import { EXCHANGE_NAME, DomainEvent, ReservationPayload } from "../common/events";
import { connectRabbit } from "../common/rabbitmq";

interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  source_event_id: string;
  created_at: string;
}

const app = express();
const PORT = Number(process.env.NOTIFICATION_PORT) || 4102;
const QUEUE_NAME = "notification-service.reservation-events";

const notifications: Notification[] = [];

app.use(cors());
app.use(express.json());

const notificationText = (event: DomainEvent<ReservationPayload>): string => {
  if (event.event_type === "reservation.created") {
    return `Бронирование #${event.payload.reservation_id} подтверждено`;
  }

  return `Бронирование #${event.payload.reservation_id} отменено`;
};

const start = async (): Promise<void> => {
  const { channel } = await connectRabbit();

  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "reservation.*");
  await channel.consume(QUEUE_NAME, (message) => {
    if (!message) {
      return;
    }

    const event = JSON.parse(message.content.toString()) as DomainEvent<ReservationPayload>;
    const notification: Notification = {
      id: notifications.length + 1,
      user_id: event.payload.user_id,
      type: event.event_type,
      message: notificationText(event),
      source_event_id: event.event_id,
      created_at: new Date().toISOString()
    };

    notifications.push(notification);
    console.log("notification.created", notification);
    channel.ack(message);
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ service: "notification-service", status: "ok", broker: "rabbitmq" });
  });

  app.get("/notifications", (_req: Request, res: Response) => {
    res.json(notifications);
  });

  app.listen(PORT, () => {
    console.log(`Notification Service started on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Notification Service failed to start", err);
  process.exit(1);
});
