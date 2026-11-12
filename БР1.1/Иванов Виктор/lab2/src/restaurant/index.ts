import "reflect-metadata";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { RestaurantDataSource } from "./dataSource";
import { createRestaurantApp } from "./app";
import { startRestaurantBookingConsumer } from "./bookingConsumer";

dotenv.config();

const port = Number(process.env.RESTAURANT_PORT || 4002);

async function main() {
  const dbPath = process.env.RESTAURANT_DATABASE_PATH || path.join(process.cwd(), "data", "restaurant.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  await RestaurantDataSource.initialize();
  const app = createRestaurantApp();
  app.listen(port, () => {
    console.log(`restaurant-service слушает порт ${port}`);
  });

  await startRestaurantBookingConsumer();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
