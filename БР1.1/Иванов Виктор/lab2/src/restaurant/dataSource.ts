import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";
import { Restaurant } from "./entity/Restaurant";
import { Table } from "./entity/Table";
import { Review } from "./entity/Review";
import { BookingEventLog } from "./entity/BookingEventLog";

dotenv.config();

const dbPath = process.env.RESTAURANT_DATABASE_PATH || path.join(process.cwd(), "data", "restaurant.sqlite");

export const RestaurantDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [Restaurant, Table, Review, BookingEventLog],
});
