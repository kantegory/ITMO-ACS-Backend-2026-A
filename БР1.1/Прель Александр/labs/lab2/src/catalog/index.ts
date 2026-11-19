import "reflect-metadata";
import { port, required } from "../shared/config";
import { createApp, finishApp, serve } from "../shared/server";
import { requireService } from "../shared/auth";
import { asyncHandler } from "../shared/async-handler";
import { asPositiveInt } from "../shared/validation";
import { badRequest, notFound } from "../shared/errors";
import { AppDataSource } from "./data-source";
import { Restaurant } from "./entities";
import { restaurantsRouter } from "./routes/restaurants.routes";
import { cuisinesRouter } from "./routes/cuisines.routes";
import { seedDatabase } from "./seed";

const main = async () => {
  required("SERVICE_KEY");
  await AppDataSource.initialize();
  await seedDatabase(AppDataSource);
  const app = createApp("catalog", AppDataSource);
  app.use("/restaurants", restaurantsRouter);
  app.use("/cuisines", cuisinesRouter);
  app.get("/internal/restaurants/:restaurantId/booking-context", requireService, asyncHandler(async (req, res) => {
    const restaurantId = asPositiveInt(req.params.restaurantId);
    if (!restaurantId) throw badRequest();
    const restaurant = await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurantId }, relations: { tables: true } });
    if (!restaurant) throw notFound("Ресторан не найден.");
    res.json({ restaurantId, restaurantName: restaurant.name, openingTime: restaurant.openingTime, closingTime: restaurant.closingTime,
      tables: restaurant.tables.filter(table => table.isActive).sort((a, b) => a.capacity - b.capacity || a.tableId - b.tableId)
        .map(table => ({ tableId: table.tableId, tableNumber: table.tableNumber, capacity: table.capacity })) });
  }));
  finishApp(app);
  serve(app, port("CATALOG_PORT", 8082), "catalog", AppDataSource);
};
main().catch(error => { console.error(error.message); process.exit(1); });
