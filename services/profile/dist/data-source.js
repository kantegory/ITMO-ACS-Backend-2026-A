"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./config/env");
const CandidateProfile_1 = require("./entities/CandidateProfile");
const Resume_1 = require("./entities/Resume");
const ResumeSummary_1 = require("./entities/ResumeSummary");
const ResumeSkill_1 = require("./entities/ResumeSkill");
const Skill_1 = require("./entities/Skill");
const _1732000001000_InitProfile_1 = require("./migrations/1732000001000-InitProfile");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: env_1.env.databaseUrl,
    entities: [CandidateProfile_1.CandidateProfile, Resume_1.Resume, ResumeSummary_1.ResumeSummary, ResumeSkill_1.ResumeSkill, Skill_1.Skill],
    migrations: [_1732000001000_InitProfile_1.InitProfile1732000001000],
    synchronize: false,
    logging: env_1.env.nodeEnv === "development",
});
