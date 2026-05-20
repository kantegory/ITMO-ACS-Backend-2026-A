"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./config/env");
const User_1 = require("./entities/User");
const CandidateProfile_1 = require("./entities/CandidateProfile");
const Resume_1 = require("./entities/Resume");
const Company_1 = require("./entities/Company");
const Vacancy_1 = require("./entities/Vacancy");
const RefreshSession_1 = require("./entities/RefreshSession");
const _1730000000000_Init_1 = require("./migrations/1730000000000-Init");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: env_1.env.databaseUrl,
    entities: [User_1.User, CandidateProfile_1.CandidateProfile, Resume_1.Resume, Company_1.Company, Vacancy_1.Vacancy, RefreshSession_1.RefreshSession],
    migrations: [_1730000000000_Init_1.Init1730000000000],
    synchronize: false,
    logging: env_1.env.nodeEnv === "development",
});
