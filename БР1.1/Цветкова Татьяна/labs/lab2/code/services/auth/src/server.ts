import "dotenv/config";
import { createApp } from "./app";
import { AppDataSource } from "./config/data-source";
import { EventBus } from "@fitness/shared";

const PORT = Number(process.env.PORT ?? 3001);

(async () => {
  await AppDataSource.initialize();
  const bus = new EventBus(
    process.env.RABBITMQ_URL,
    process.env.EVENT_SUBSCRIBERS,
    "auth-service",
  );
  await bus.connect(); // в RabbitMQ-режиме подключается, в HTTP-режиме noop
  const app = createApp(bus);
  // auth ничего не слушает (только публикует) — startConsumer не нужен
  app.listen(PORT, () => {
    console.log(`[auth-service] listening on http://localhost:${PORT}`);
  });
})().catch((err) => {
  console.error("[auth-service] failed to start:", err);
  process.exit(1);
});
