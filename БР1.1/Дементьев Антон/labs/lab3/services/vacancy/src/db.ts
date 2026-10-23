import { makeDataSource } from '@jobsearch/common';
import { Company } from './models/company.entity';
import { Vacancy } from './models/vacancy.entity';
import { VacancySkill } from './models/vacancy-skill.entity';
import { FavoriteVacancy } from './models/favorite-vacancy.entity';

export const dataSource = makeDataSource([Company, Vacancy, VacancySkill, FavoriteVacancy]);
