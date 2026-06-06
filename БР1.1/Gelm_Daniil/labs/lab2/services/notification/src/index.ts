import "dotenv/config";
import amqp from "amqplib";
import { createApp, listen } from "../../../shared/create-app.js";
import { EVENTS_EXCHANGE, type JobSearchEvent } from "../../../shared/events.js";

const QUEUE = "notification-service";
const ROUTING_KEYS = ["application.created", "application.status_changed"];

const recent: JobSearchEvent[] = [];
const MAX_RECENT = 50;

const app = createApp();

app.get("/notifications/recent", (_req, res) => {
  res.json(recent.slice(-20).reverse());
});

async function startConsumer(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });

  for (const key of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EVENTS_EXCHANGE, key);
  }

  await channel.consume(QUEUE, (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString()) as JobSearchEvent;
      recent.push(event);
      if (recent.length > MAX_RECENT) recent.shift();

      if (event.type === "application.created") {
        console.log(`[notification] новый отклик #${event.applicationId} на вакансию ${event.vacancyId}`);
      } else {
        console.log(`[notification] статус отклика #${event.applicationId}: ${event.oldStatus} -> ${event.newStatus}`);
      }
    } catch (error) {
      console.error("[notification] ошибка обработки сообщения:", error);
    }

    channel.ack(message);
  });

  console.log("[notification] слушаю очередь", QUEUE);
}

startConsumer()
  .then(() => listen(app, 3008, "Notification Service"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
