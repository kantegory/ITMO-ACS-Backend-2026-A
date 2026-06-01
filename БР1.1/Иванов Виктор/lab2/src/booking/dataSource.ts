import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";
import { Booking } from "./entity/Booking";

dotenv.config();

const dbPath = process.env.BOOKING_DATABASE_PATH || path.join(process.cwd(), "data", "booking.sqlite");

export const BookingDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [Booking],
});
