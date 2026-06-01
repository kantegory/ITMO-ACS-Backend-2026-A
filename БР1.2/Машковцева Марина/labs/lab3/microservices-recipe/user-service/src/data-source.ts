import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./models/User";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "user_db.sqlite",
    synchronize: true,
    logging: true,
    entities: [User],
});
