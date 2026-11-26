import "reflect-metadata";
import { DataSource } from "typeorm";
import { Recipe } from "./models/Recipe";
import { Step } from "./models/Step";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "recipe_db.sqlite",
    synchronize: true,
    logging: true,
    entities: [Recipe, Step],
});
