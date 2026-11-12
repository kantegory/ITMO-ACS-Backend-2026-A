import amqplib from "amqplib";
import { NotificationDataSource } from "./dataSource";
import { NotificationLog } from "./entity/NotificationLog";

export async function startNotificationWorker(): Promise<void> {
  const url = process.env.AMQP_URL || "amqp://localhost:5672";
  const exchange = process.env.BOOKING_EVENTS_EXCHANGE || "booking_events";

  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchange, "fanout", { durable: true });

  const { queue } = await channel.assertQueue("booking_events_notifications", { durable: true });
  await channel.bindQueue(queue, exchange, "");

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const raw = msg.content.toString();
      const data = JSON.parse(raw) as { booking_id?: string };
      const repo = NotificationDataSource.getRepository(NotificationLog);
      await repo.save(
        repo.create({
          booking_id: data.booking_id || "unknown",
          message_json: raw,
        })
      );
      channel.ack(msg);
      console.log("[notification-service] запись в notification_log, booking_id=", data.booking_id);
    } catch (e) {
      console.error("[notification-service] ошибка:", e);
      channel.nack(msg, false, false);
    }
  });

  console.log("[notification-service] подписан на exchange", exchange);
}
