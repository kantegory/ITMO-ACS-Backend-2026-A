import "reflect-metadata";
import { port } from "../shared/config";
import { createApp, finishApp, serve } from "../shared/server";
import { requireAuth } from "../shared/auth";
import { asyncHandler } from "../shared/async-handler";
import { getPagination } from "../shared/pagination";
import { AppDataSource } from "./data-source";
import { Notification } from "./Notification";
import { startConsumer } from "./consumer";

const main = async () => {
  await AppDataSource.initialize();
  const consumer = startConsumer();
  const app = createApp("notifications", AppDataSource);
  app.get("/ready", (_req, res) => res.status(consumer.isConnected() ? 200 : 503).json({
    status: consumer.isConnected() ? "ok" : "degraded", brokerConnected: consumer.isConnected(),
  }));
  app.get("/notifications/me", requireAuth, asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req.query);
    const [items, totalItems] = await AppDataSource.getRepository(Notification).findAndCount({
      where: { userId: req.user!.userId }, order: { occurredAt: "DESC", receivedAt: "DESC", eventId: "ASC" }, skip: (page - 1) * limit, take: limit,
    });
    res.json({ items, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
  }));
  finishApp(app);
  serve(app, port("NOTIFICATIONS_PORT", 8084), "notifications", AppDataSource, consumer.stop);
};
main().catch(error => { console.error(error.message); process.exit(1); });
