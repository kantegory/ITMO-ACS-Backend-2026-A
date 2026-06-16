import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { PropertyType } from "./entities/PropertyType";
import { Property } from "./entities/Property";
import { Photo } from "./entities/Photo";
import { RentalCondition } from "./entities/RentalCondition";
import { Deal } from "./entities/Deal";
import { Message } from "./entities/Message";
import { RefreshToken } from "./entities/RefreshToken";
import { PasswordResetToken } from "./entities/PasswordResetToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER || "rent",
  password: process.env.DB_PASS || "rent",
  database: process.env.DB_NAME || "rent",
  synchronize: true,
  logging: false,
  entities: [
    User,
    PropertyType,
    Property,
    Photo,
    RentalCondition,
    Deal,
    Message,
    RefreshToken,
    PasswordResetToken,
  ],
});
