import amqplib from "amqplib";
import { RestaurantDataSource } from "./dataSource";
import { BookingEventLog } from "./entity/BookingEventLog";

export async function startRestaurantBookingConsumer(): Promise<void> {
  const url = process.env.AMQP_URL || "amqp://localhost:5672";
  const exchange = process.env.BOOKING_EVENTS_EXCHANGE || "booking_events";

  const connection = await amqplib.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange(exchange, "fanout", { durable: true });

  const { queue } = await channel.assertQueue("booking_events_restaurant", { durable: true });
  await channel.bindQueue(queue, exchange, "");

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const raw = msg.content.toString();
      const data = JSON.parse(raw) as { booking_id?: string };
      const logRepo = RestaurantDataSource.getRepository(BookingEventLog);
      await logRepo.save(
        logRepo.create({
          booking_id: data.booking_id || "unknown",
          payload_json: raw,
        })
      );
      channel.ack(msg);
      console.log("[restaurant-service] событие бронирования записано в booking_event_log");
    } catch (e) {
      console.error("[restaurant-service] ошибка обработки сообщения:", e);
      channel.nack(msg, false, false);
    }
  });

  console.log("[restaurant-service] подписан на RabbitMQ exchange", exchange);
}
