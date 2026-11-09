"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const entity_1 = require("./entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "sqlite",
    database: "fitness.db",
    synchronize: true,
    logging: false,
    entities: [
        entity_1.User,
        entity_1.UserProfile,
        entity_1.UserProgress,
        entity_1.Exercise,
        entity_1.Workout,
        entity_1.UserWorkout,
        entity_1.BlogPost,
    ],
});
