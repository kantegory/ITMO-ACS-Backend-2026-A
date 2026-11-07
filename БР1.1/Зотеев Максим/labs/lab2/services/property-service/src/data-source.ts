import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./config";
import { PropertyType } from "./entities/PropertyType";
import { Location } from "./entities/Location";
import { Property } from "./entities/Property";
import { PropertyPhoto } from "./entities/PropertyPhoto";
import { Amenity } from "./entities/Amenity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: true,
  logging: false,
  entities: [PropertyType, Location, Property, PropertyPhoto, Amenity],
});
