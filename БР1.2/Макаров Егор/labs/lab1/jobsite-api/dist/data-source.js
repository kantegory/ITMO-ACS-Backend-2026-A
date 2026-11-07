"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./config/env");
const User_1 = require("./entities/User");
const JobSeeker_1 = require("./entities/JobSeeker");
const Employer_1 = require("./entities/Employer");
const Company_1 = require("./entities/Company");
const Industry_1 = require("./entities/Industry");
const Resume_1 = require("./entities/Resume");
const WorkExperience_1 = require("./entities/WorkExperience");
const Education_1 = require("./entities/Education");
const Skill_1 = require("./entities/Skill");
const Vacancy_1 = require("./entities/Vacancy");
const Application_1 = require("./entities/Application");
const SavedVacancy_1 = require("./entities/SavedVacancy");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    username: env_1.env.db.user,
    password: env_1.env.db.password,
    database: env_1.env.db.name,
    synchronize: true,
    logging: env_1.env.nodeEnv === 'development' ? ['error'] : false,
    entities: [
        User_1.User, JobSeeker_1.JobSeeker, Employer_1.Employer, Company_1.Company, Industry_1.Industry, Resume_1.Resume,
        WorkExperience_1.WorkExperience, Education_1.Education, Skill_1.Skill, Vacancy_1.Vacancy, Application_1.Application, SavedVacancy_1.SavedVacancy,
    ],
});
//# sourceMappingURL=data-source.js.map