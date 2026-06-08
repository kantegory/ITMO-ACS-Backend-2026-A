import "dotenv/config";
import { createApp } from "./app";
import { AppDataSource } from "./config/data-source";
import { EventBus } from "@fitness/shared";

const PORT = Number(process.env.PORT ?? 3004);

(async () => {
  await AppDataSource.initialize();
  const bus = new EventBus(
    process.env.RABBITMQ_URL,
    process.env.EVENT_SUBSCRIBERS,
    "plan-service",
  );
  await bus.connect();
  // createApp регистрирует bus.on() — обработчики workout.deleted / workout.updated / user.deleted
  const app = createApp(bus);
  // создаём очередь plan-service.events и биндим её к exchange events по нужным routing keys
  await bus.startConsumer();
  app.listen(PORT, () => {
    console.log(`[plan-service] listening on http://localhost:${PORT}`);
  });
})().catch((err) => {
  console.error("[plan-service] failed to start:", err);
  process.exit(1);
});
