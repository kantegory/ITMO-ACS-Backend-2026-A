import amqp from "amqplib";
import type { ApplicationCreatedPayload } from "./types";
import {
  EMPLOYER_APPLICATION_EVENTS_QUEUE,
  JOB_EVENTS_EXCHANGE,
  ROUTING_KEY_APPLICATION_CREATED,
} from "./topology";

const retryMs = 5000;

export function startEmployerApplicationEventsConsumer(
  onApplicationCreated: (payload: ApplicationCreatedPayload) => Promise<void>
): void {
  const url = process.env.RABBITMQ_URL?.trim();
  if (!url) {
    console.warn("RABBITMQ_URL не задан, consumer employer отключён");
    return;
  }

  const loop = async (): Promise<void> => {
    try {
      const conn = await amqp.connect(url);
      conn.on("error", (err) => console.error("consumer connection error", err));

      const ch = await conn.createChannel();
      await ch.assertExchange(JOB_EVENTS_EXCHANGE, "topic", { durable: true });
      const { queue } = await ch.assertQueue(EMPLOYER_APPLICATION_EVENTS_QUEUE, { durable: true });
      await ch.bindQueue(queue, JOB_EVENTS_EXCHANGE, ROUTING_KEY_APPLICATION_CREATED);
      await ch.prefetch(5);

      await ch.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const raw = JSON.parse(msg.content.toString()) as ApplicationCreatedPayload;
          await onApplicationCreated(raw);
          ch.ack(msg);
        } catch (e) {
          console.error("ошибка обработки application.created", e);
          ch.nack(msg, false, false);
        }
      });

      console.log("employer: consumer готов, очередь", EMPLOYER_APPLICATION_EVENTS_QUEUE);
    } catch (e) {
      console.error("consumer: не удалось подключиться к RabbitMQ, повтор через", retryMs, "мс", e);
      setTimeout(() => void loop(), retryMs);
    }
  };

  void loop();
}
