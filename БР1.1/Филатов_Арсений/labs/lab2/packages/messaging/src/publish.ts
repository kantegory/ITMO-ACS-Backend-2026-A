import amqp from "amqplib";
import type { ApplicationCreatedPayload } from "./types";
import { JOB_EVENTS_EXCHANGE, ROUTING_KEY_APPLICATION_CREATED } from "./topology";

let channelPromise: Promise<amqp.Channel> | null = null;

async function getPublishChannel(): Promise<amqp.Channel | null> {
  const url = process.env.RABBITMQ_URL;
  if (!url?.trim()) return null;

  if (!channelPromise) {
    channelPromise = (async () => {
      const conn = await amqp.connect(url);
      conn.on("error", (err) => {
        console.error("[messaging] publisher connection error", err);
        channelPromise = null;
      });
      const ch = await conn.createChannel();
      await ch.assertExchange(JOB_EVENTS_EXCHANGE, "topic", { durable: true });
      return ch;
    })().catch((e) => {
      channelPromise = null;
      throw e;
    });
  }
  return channelPromise;
}

export async function publishApplicationCreated(payload: ApplicationCreatedPayload): Promise<void> {
  try {
    const ch = await getPublishChannel();
    if (!ch) {
      console.warn("[messaging] RABBITMQ_URL не задан, событие application.created не отправлено");
      return;
    }
    ch.publish(JOB_EVENTS_EXCHANGE, ROUTING_KEY_APPLICATION_CREATED, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: "application/json",
    });
  } catch (e) {
    console.error("[messaging] не удалось отправить application.created", e);
  }
}
