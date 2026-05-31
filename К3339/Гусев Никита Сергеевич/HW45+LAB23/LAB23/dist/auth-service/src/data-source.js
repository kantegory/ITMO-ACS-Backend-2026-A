"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const Follow_1 = require("./entities/Follow");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "auth-db",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "auth_db",
    synchronize: true,
    logging: false,
    entities: [User_1.User, Follow_1.Follow],
});
