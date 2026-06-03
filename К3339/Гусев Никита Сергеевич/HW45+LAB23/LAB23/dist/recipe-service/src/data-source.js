"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Recipe_1 = require("./entities/Recipe");
const Like_1 = require("./entities/Like");
const SavedRecipe_1 = require("./entities/SavedRecipe");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "recipe-db",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "recipe_db",
    synchronize: true,
    logging: false,
    entities: [Recipe_1.Recipe, Like_1.Like, SavedRecipe_1.SavedRecipe],
});
