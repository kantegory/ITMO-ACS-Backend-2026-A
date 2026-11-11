import "reflect-metadata";
import { DataSource } from "typeorm";
import { PropertyType } from "./entities/PropertyType";
import { Property } from "./entities/Property";
import { Photo } from "./entities/Photo";
import { RentalCondition } from "./entities/RentalCondition";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.CATALOG_DB_HOST || "localhost",
  port: parseInt(process.env.CATALOG_DB_PORT || "5434", 10),
  username: process.env.CATALOG_DB_USER || "rent",
  password: process.env.CATALOG_DB_PASS || "rent",
  database: process.env.CATALOG_DB_NAME || "catalog_db",
  synchronize: true,
  logging: false,
  entities: [PropertyType, Property, Photo, RentalCondition],
});
