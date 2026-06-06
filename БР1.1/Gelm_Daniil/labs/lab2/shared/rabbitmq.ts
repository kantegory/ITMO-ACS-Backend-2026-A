import amqp from "amqplib";
import { EVENTS_EXCHANGE } from "./events.js";

let channel: amqp.Channel | null = null;

export async function getRabbitChannel(): Promise<amqp.Channel | null> {
  if (channel) return channel;

  const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
  try {
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
    return channel;
  } catch (error) {
    console.error("[rabbitmq] не удалось подключиться:", error);
    return null;
  }
}

export async function publishEvent(routingKey: string, payload: unknown): Promise<boolean> {
  const ch = await getRabbitChannel();
  if (!ch) return false;

  ch.publish(EVENTS_EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
  });
  return true;
}
