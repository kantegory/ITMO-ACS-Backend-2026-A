import "reflect-metadata";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { BookingDataSource } from "./dataSource";
import { createBookingApp } from "./app";
import { getPublisherChannel } from "./amqpPublish";

dotenv.config();

const port = Number(process.env.BOOKING_PORT || 4003);

async function main() {
  const dbPath = process.env.BOOKING_DATABASE_PATH || path.join(process.cwd(), "data", "booking.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  await BookingDataSource.initialize();
  await getPublisherChannel();
  const app = createBookingApp();
  app.listen(port, () => {
    console.log(`booking-service слушает порт ${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
