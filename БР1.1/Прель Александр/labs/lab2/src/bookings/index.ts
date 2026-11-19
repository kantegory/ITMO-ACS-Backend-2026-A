import "reflect-metadata";
import { port, required } from "../shared/config";
import { createApp, finishApp, serve } from "../shared/server";
import { AppDataSource, installBookingGuards } from "./data-source";
import { reservationsRouter } from "./routes";
import { messagingEnabled } from "../messaging/rabbit";
import { installOutbox, startPublisher } from "./outbox";
import { OutboxEvent } from "./entities/OutboxEvent";
import { requireService } from "../shared/auth";
import { asyncHandler } from "../shared/async-handler";
import { IsNull } from "typeorm";

const main = async () => {
  required("SERVICE_KEY");
  await AppDataSource.initialize();
  await installBookingGuards();
  if (messagingEnabled()) await installOutbox();
  const publisher = messagingEnabled() ? startPublisher() : undefined;
  const app = createApp("bookings", AppDataSource);
  app.get("/ready", (_req, res) => res.status(!publisher || publisher.isConnected() ? 200 : 503).json({
    status: !publisher || publisher.isConnected() ? "ok" : "degraded", brokerConnected: publisher?.isConnected() ?? false,
  }));
  app.get("/internal/messaging/status", requireService, asyncHandler(async (_req, res) => {
    const pending = publisher ? await AppDataSource.getRepository(OutboxEvent).countBy({ publishedAt: IsNull() }) : 0;
    res.json({ enabled: Boolean(publisher), brokerConnected: publisher?.isConnected() ?? false, pending });
  }));
  app.use("/reservations", reservationsRouter);
  finishApp(app);
  serve(app, port("BOOKINGS_PORT", 8083), "bookings", AppDataSource, publisher?.stop);
};
main().catch(error => { console.error(error.message); process.exit(1); });
