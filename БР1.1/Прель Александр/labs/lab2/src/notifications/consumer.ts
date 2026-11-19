import { AppDataSource } from "./data-source";
import { InvalidEvent, parseEvent } from "../messaging/events";
import { confirmPublish, pause, rabbitWorker, topology } from "../messaging/rabbit";

export const startConsumer = () => rabbitWorker(async (channel, signal) => {
  await channel.prefetch(1);
  let active: Promise<void> = Promise.resolve();
  const consume = await channel.consume(topology().queue, message => {
    if (!message) { void channel.close().catch(() => {}); return; }
    active = (async () => {
      try {
        const event = parseEvent(message.content);
        if (message.properties.messageId !== event.eventId || message.fields.routingKey !== event.type) throw new InvalidEvent("Envelope does not match AMQP properties");
        const action = event.type === "reservation.created" ? "создано" : "отменено";
        // A unique event_id and a single insert make retries idempotent, including after restart.
        await AppDataSource.query(`INSERT INTO notifications
          (event_id, user_id, reservation_id, type, message, occurred_at, received_at)
          VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_id) DO NOTHING`, [
          event.eventId, event.data.userId, event.data.reservationId, event.type,
          `Бронирование №${event.data.reservationId} в ${event.data.restaurantName} ${action}.`,
          event.occurredAt, new Date().toISOString(),
        ]);
        channel.ack(message);
      } catch (error) {
        const rawAttempts = Number(message.properties.headers?.["x-retry-count"] ?? 0);
        const attempts = Number.isInteger(rawAttempts) && rawAttempts >= 0 ? rawAttempts : 0;
        const dead = error instanceof InvalidEvent || attempts >= 3;
        if (!dead) await pause(300, signal);
        if (signal.aborted) return;
        await confirmPublish(channel, dead ? topology().deadExchange : topology().exchange,
          message.fields.routingKey, message.content, {
            messageId: message.properties.messageId,
            type: message.properties.type,
            headers: { ...message.properties.headers, "x-retry-count": dead ? attempts : attempts + 1,
              ...(dead ? { "x-error": error instanceof InvalidEvent ? "INVALID_EVENT" : "PROCESSING_FAILED" } : {}) },
          });
        channel.ack(message);
      }
    })().catch(() => { void channel.close().catch(() => {}); });
  }, { noAck: false });
  while (!signal.aborted) await pause(500, signal);
  await channel.cancel(consume.consumerTag).catch(() => {});
  await active;
});
