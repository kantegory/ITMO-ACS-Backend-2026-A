import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Restaurant } from "./entities/Restaurant";
import { Table } from "./entities/Table";
import { Booking } from "./entities/Booking";
import { Review } from "./entities/Review";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_PATH || "./database.sqlite",
  synchronize: true,
  logging: false,
  entities: [User, Restaurant, Table, Booking, Review],
});
