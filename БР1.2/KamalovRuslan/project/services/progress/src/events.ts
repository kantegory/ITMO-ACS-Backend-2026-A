import amqp, {
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
} from "amqplib";
import type { DomainEvent } from "@fitflow/shared";
import { dataSource } from "./data-source.js";
import { WorkoutSnapshot } from "./entities.js";

const exchange = "fitflow.events";
const queue = "fitflow.progress.workout-created";
let connection: ChannelModel | undefined;
let channel: Channel | undefined;

type WorkoutCreated = DomainEvent<{
  id: string;
  name: string;
  type: string;
  level: string;
}>;

function isWorkoutCreated(value: unknown): value is WorkoutCreated {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<WorkoutCreated>;
  return (
    event.type === "workout.created" &&
    typeof event.id === "string" &&
    !!event.payload &&
    typeof event.payload.id === "string" &&
    typeof event.payload.name === "string" &&
    typeof event.payload.type === "string" &&
    typeof event.payload.level === "string"
  );
}

async function consume(message: ConsumeMessage | null): Promise<void> {
  if (!message || !channel) return;
  try {
    const event: unknown = JSON.parse(message.content.toString("utf8"));
    if (!isWorkoutCreated(event))
      throw new Error("Invalid workout.created event");
    await dataSource.getRepository(WorkoutSnapshot).upsert(
      {
        id: event.payload.id,
        name: event.payload.name,
        type: event.payload.type,
        level: event.payload.level,
        sourceEventId: event.id,
      },
      ["id"],
    );
    channel.ack(message);
  } catch (error) {
    console.error("Could not process workout.created", error);
    channel.nack(message, false, false);
  }
}

export async function startConsumer(): Promise<void> {
  const url = process.env.RABBITMQ_URL;
  if (!url) {
    console.warn("RABBITMQ_URL is not set; workout projection is disabled");
    return;
  }
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "workout.created");
    await channel.prefetch(10);
    await channel.consume(queue, (message) => {
      void consume(message);
    });
    connection.on("error", (error) =>
      console.error("RabbitMQ connection error", error),
    );
  } catch (error) {
    console.error("Не удалось подключить получателя RabbitMQ", error);
    throw error;
  }
}

export async function stopConsumer(): Promise<void> {
  await channel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
}
