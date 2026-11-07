import amqplib, { Channel, ChannelModel, ConsumeMessage } from "amqplib";
import { config } from "../config";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";

const EXCHANGE = "rental.events";
const QUEUE = "messaging.rental-events";

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

const handleEvent = async (routingKey: string, raw: string) => {
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
  await repo.save(
    repo.create({
      rentalId: payload.rental_id,
      senderId: null,
      kind: "system",
      body: tpl(payload),
    })
  );
};

export const connectRabbit = async () => {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      connection = await amqplib.connect(config.rabbitmqUrl);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(QUEUE, EXCHANGE, "rental.*");

      await channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
        if (!msg) return;
        try {
          await handleEvent(msg.fields.routingKey, msg.content.toString());
          channel!.ack(msg);
        } catch (e) {
          console.error("Ошибка обработки сообщения:", e);
          // Безопасно не зацикливаем: отбрасываем сообщение.
          channel!.nack(msg, false, false);
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
