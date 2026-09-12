import { IsNull } from "typeorm";
import { AppDataSource } from "./data-source";
import { OutboxEvent } from "./entities/OutboxEvent";
import { parseEvent } from "../messaging/events";
import { confirmPublish, pause, rabbitWorker, topology } from "../messaging/rabbit";

export const installOutbox = async () => {
  const data = `json_object('reservationId', NEW.reservation_id, 'userId', NEW.user_id,
    'restaurantId', NEW.restaurant_id, 'restaurantName', NEW.restaurant_name,
    'tableId', NEW.table_id, 'tableNumber', NEW.table_number, 'reservationDate', NEW.reservation_date,
    'startTime', NEW.start_time, 'endTime', NEW.end_time, 'guestsCount', NEW.guests_count, 'status', NEW.status)`;
  for (const [name, operation, condition, type] of [
    ["created", "INSERT", "NEW.status = 'confirmed'", "reservation.created"],
    ["cancelled", "UPDATE OF status", "NEW.status = 'cancelled' AND OLD.status IN ('pending', 'confirmed')", "reservation.cancelled"],
  ]) {
    // The trigger and reservation mutation commit or roll back as one SQLite statement.
    await AppDataSource.query(`CREATE TRIGGER IF NOT EXISTS reservations_outbox_${name}
      AFTER ${operation} ON reservations WHEN ${condition}
      BEGIN
        INSERT INTO outbox_events (event_id, payload, published_at)
        SELECT event_id, json_object('eventId', event_id, 'schemaVersion', 1, 'type', '${type}',
          'occurredAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'data', ${data}), NULL
        FROM (SELECT lower(hex(randomblob(16))) AS event_id);
      END`);
  }
};

export const startPublisher = () => rabbitWorker(async (channel, signal) => {
  const repository = AppDataSource.getRepository(OutboxEvent);
  while (!signal.aborted) {
    const row = await repository.findOne({ where: { publishedAt: IsNull() }, order: { sequence: "ASC" } });
    if (!row) { await pause(150, signal); continue; }
    const body = Buffer.from(row.payload);
    const event = parseEvent(body);
    await confirmPublish(channel, topology().exchange, event.type, body, { messageId: event.eventId, type: event.type });
    await repository.update({ sequence: row.sequence }, { publishedAt: new Date().toISOString() });
  }
});
