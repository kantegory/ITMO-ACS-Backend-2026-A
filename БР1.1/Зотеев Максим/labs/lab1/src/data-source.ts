import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "./config";
import { User } from "./entities/User";
import { PropertyType } from "./entities/PropertyType";
import { Location } from "./entities/Location";
import { Property } from "./entities/Property";
import { PropertyPhoto } from "./entities/PropertyPhoto";
import { Amenity } from "./entities/Amenity";
import { Rental } from "./entities/Rental";
import { Message } from "./entities/Message";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: true,
  logging: false,
  entities: [User, PropertyType, Location, Property, PropertyPhoto, Amenity, Rental, Message],
});
