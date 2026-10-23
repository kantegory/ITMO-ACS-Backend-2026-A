import { makeDataSource } from '@jobsearch/common';
import { IndexJob, ResumeIndex, ResumeSkillIndex, VacancyIndex, VacancySkillIndex } from './models/index.entities';

export const dataSource = makeDataSource([VacancyIndex, VacancySkillIndex, ResumeIndex, ResumeSkillIndex, IndexJob]);
