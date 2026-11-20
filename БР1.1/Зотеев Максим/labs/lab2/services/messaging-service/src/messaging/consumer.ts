import { restartOnBrokerDisconnect } from "@rental/shared";
import amqplib, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import { config } from "../config";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";

const EXCHANGE = "rental.events";
const QUEUE = "messaging.rental-events";
const MAX_ATTEMPTS = 8;

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

interface RentalEvent {
  rental_id: string;
  property_id: string;
  property_title?: string;
  tenant_id: string;
  owner_id: string;
  occurred_at: string;
}

const SYSTEM_TEXT: Record<string, (e: RentalEvent) => string> = {
  "rental.created": (e) =>
    `Сделка по объекту "${e.property_title ?? "—"}" создана. Желаем удачной аренды!`,
  "rental.completed": () => "Сделка успешно завершена.",
  "rental.cancelled": () => "Сделка отменена.",
};

const handleEvent = async (routingKey: string, raw: string, eventId?: string) => {
  const tpl = SYSTEM_TEXT[routingKey];
  if (!tpl) return;
  let payload: RentalEvent;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.warn("Не удалось распарсить событие:", routingKey, raw);
    return;
  }
  const repo = AppDataSource.getRepository(Message);
  await repo.createQueryBuilder().insert().values({
    rentalId: payload.rental_id,
    senderId: null,
    kind: "system",
    body: tpl(payload),
    eventId: eventId ?? null,
  }).orIgnore().execute();
};

export const connectRabbit = async () => {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      connection = await amqplib.connect(config.rabbitmqUrl);
      channel = await connection.createChannel();
      restartOnBrokerDisconnect(connection, channel);
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "rental.*");

      await channel.prefetch(8);
      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          await handleEvent(msg.fields.routingKey, msg.content.toString(), msg.properties.messageId);
          channel!.ack(msg);
        } catch (e) {
          console.error("Ошибка обработки сообщения:", e);
          // Quorum queues count redeliveries in x-delivery-count. Back off 1, 2, 4 … 30 s (about
          // two minutes in total, longer than a PostgreSQL failover), then let the queue policy
          // dead-letter the event to messaging.failed, from where the replay job re-publishes it.
          const attempts = Number(msg.properties.headers?.["x-delivery-count"] ?? 0);
          const retry = process.env.RABBIT_DEAD_LETTER === "true" && attempts < MAX_ATTEMPTS;
          if (retry) await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempts, 30000)));
          channel!.nack(msg, false, retry);
        }
      });

      console.log("RabbitMQ consumer connected and listening");
      return;
    } catch (e) {
      console.warn(`RabbitMQ connect attempt ${attempt} failed:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Failed to connect to RabbitMQ after retries");
};
