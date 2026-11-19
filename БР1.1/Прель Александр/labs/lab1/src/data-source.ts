import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { DataSource } from "typeorm";
import { config } from "./config";
import {
  Cuisine,
  MenuCategory,
  MenuItem,
  Reservation,
  Restaurant,
  RestaurantPhoto,
  RestaurantTable,
  Review,
  User,
} from "./entities";

const databaseDir = path.dirname(config.databasePath);
if (databaseDir && databaseDir !== ".") {
  fs.mkdirSync(databaseDir, { recursive: true });
}

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: config.databasePath,
  synchronize: true,
  logging: false,
  entities: [
    User,
    Restaurant,
    Cuisine,
    RestaurantTable,
    Reservation,
    Review,
    MenuCategory,
    MenuItem,
    RestaurantPhoto,
  ],
});
