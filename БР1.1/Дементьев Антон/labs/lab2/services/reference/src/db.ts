import { makeDataSource } from '@jobsearch/common';
import { Industry } from './models/industry.entity';
import { Skill } from './models/skill.entity';

export const dataSource = makeDataSource([Industry, Skill]);
