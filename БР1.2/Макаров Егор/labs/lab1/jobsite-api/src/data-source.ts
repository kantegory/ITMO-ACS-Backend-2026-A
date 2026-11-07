import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './config/env';
import { User } from './entities/User';
import { JobSeeker } from './entities/JobSeeker';
import { Employer } from './entities/Employer';
import { Company } from './entities/Company';
import { Industry } from './entities/Industry';
import { Resume } from './entities/Resume';
import { WorkExperience } from './entities/WorkExperience';
import { Education } from './entities/Education';
import { Skill } from './entities/Skill';
import { Vacancy } from './entities/Vacancy';
import { Application } from './entities/Application';
import { SavedVacancy } from './entities/SavedVacancy';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  synchronize: true,
  logging: env.nodeEnv === 'development' ? ['error'] : false,
  entities: [
    User, JobSeeker, Employer, Company, Industry, Resume,
    WorkExperience, Education, Skill, Vacancy, Application, SavedVacancy,
  ],
});
