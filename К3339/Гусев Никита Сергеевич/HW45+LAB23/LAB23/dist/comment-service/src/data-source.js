"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Comment_1 = require("./entities/Comment");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "comment-db",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "comment_db",
    synchronize: true,
    logging: false,
    entities: [Comment_1.Comment],
});
