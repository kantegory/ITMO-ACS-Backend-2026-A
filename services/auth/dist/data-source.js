"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./config/env");
const User_1 = require("./entities/User");
const RefreshSession_1 = require("./entities/RefreshSession");
const _1732000000000_InitAuth_1 = require("./migrations/1732000000000-InitAuth");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: env_1.env.databaseUrl,
    entities: [User_1.User, RefreshSession_1.RefreshSession],
    migrations: [_1732000000000_InitAuth_1.InitAuth1732000000000],
    synchronize: false,
    logging: env_1.env.nodeEnv === "development",
});
