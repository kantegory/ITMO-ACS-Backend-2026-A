import "dotenv/config";
import { createApp } from "./app";
import { AppDataSource } from "./config/data-source";
import { EventBus } from "@fitness/shared";

const PORT = Number(process.env.PORT ?? 3003);

(async () => {
  await AppDataSource.initialize();
  const bus = new EventBus(
    process.env.RABBITMQ_URL,
    process.env.EVENT_SUBSCRIBERS,
    "catalog-service",
  );
  await bus.connect();
  const app = createApp(bus);
  // catalog только публикует (workout.created/updated/deleted), не слушает
  app.listen(PORT, () => {
    console.log(`[catalog-service] listening on http://localhost:${PORT}`);
  });
})().catch((err) => {
  console.error("[catalog-service] failed to start:", err);
  process.exit(1);
});
