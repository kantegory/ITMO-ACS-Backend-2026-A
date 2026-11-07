import { AppDataSource } from './data-source';
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

export const repos = {
  user: () => AppDataSource.getRepository(User),
  jobSeeker: () => AppDataSource.getRepository(JobSeeker),
  employer: () => AppDataSource.getRepository(Employer),
  company: () => AppDataSource.getRepository(Company),
  industry: () => AppDataSource.getRepository(Industry),
  resume: () => AppDataSource.getRepository(Resume),
  workExperience: () => AppDataSource.getRepository(WorkExperience),
  education: () => AppDataSource.getRepository(Education),
  skill: () => AppDataSource.getRepository(Skill),
  vacancy: () => AppDataSource.getRepository(Vacancy),
  application: () => AppDataSource.getRepository(Application),
  savedVacancy: () => AppDataSource.getRepository(SavedVacancy),
};
