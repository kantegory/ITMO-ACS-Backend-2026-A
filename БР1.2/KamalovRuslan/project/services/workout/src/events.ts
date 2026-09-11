import amqp, { type Channel, type ChannelModel } from "amqplib";
import { randomUUID } from "node:crypto";
import type { DomainEvent } from "@fitflow/shared";

const exchange = "fitflow.events";
let connection: ChannelModel | undefined;
let channel: Channel | undefined;

export async function startPublisher(): Promise<void> {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    console.warn("RABBITMQ_URL is not set; workout events are disabled");
    return;
  }
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });
    connection.on("error", (error) => console.error("RabbitMQ connection error", error));
  } catch (error) {
    console.error("Не удалось подключить отправителя RabbitMQ", error);
    throw error;
  }
}

export function publishWorkoutCreated(payload: { id: string; name: string; type: string; level: string }): void {
  if (!channel) return;
  const event: DomainEvent<typeof payload> = {
    id: randomUUID(), type: "workout.created", occurredAt: new Date().toISOString(), payload,
  };
  channel.publish(exchange, event.type, Buffer.from(JSON.stringify(event)), {
    persistent: true, contentType: "application/json", messageId: event.id, timestamp: Date.now(),
  });
}

export async function stopPublisher(): Promise<void> {
  await channel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
}
