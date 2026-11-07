"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repos = void 0;
const data_source_1 = require("./data-source");
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
exports.repos = {
    user: () => data_source_1.AppDataSource.getRepository(User_1.User),
    jobSeeker: () => data_source_1.AppDataSource.getRepository(JobSeeker_1.JobSeeker),
    employer: () => data_source_1.AppDataSource.getRepository(Employer_1.Employer),
    company: () => data_source_1.AppDataSource.getRepository(Company_1.Company),
    industry: () => data_source_1.AppDataSource.getRepository(Industry_1.Industry),
    resume: () => data_source_1.AppDataSource.getRepository(Resume_1.Resume),
    workExperience: () => data_source_1.AppDataSource.getRepository(WorkExperience_1.WorkExperience),
    education: () => data_source_1.AppDataSource.getRepository(Education_1.Education),
    skill: () => data_source_1.AppDataSource.getRepository(Skill_1.Skill),
    vacancy: () => data_source_1.AppDataSource.getRepository(Vacancy_1.Vacancy),
    application: () => data_source_1.AppDataSource.getRepository(Application_1.Application),
    savedVacancy: () => data_source_1.AppDataSource.getRepository(SavedVacancy_1.SavedVacancy),
};
//# sourceMappingURL=repos.js.map