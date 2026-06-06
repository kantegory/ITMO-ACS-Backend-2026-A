"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./config/env");
const Company_1 = require("./entities/Company");
const Vacancy_1 = require("./entities/Vacancy");
const _1732000002000_InitVacancy_1 = require("./migrations/1732000002000-InitVacancy");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: env_1.env.databaseUrl,
    entities: [Company_1.Company, Vacancy_1.Vacancy],
    migrations: [_1732000002000_InitVacancy_1.InitVacancy1732000002000],
    synchronize: false,
    logging: env_1.env.nodeEnv === "development",
});
