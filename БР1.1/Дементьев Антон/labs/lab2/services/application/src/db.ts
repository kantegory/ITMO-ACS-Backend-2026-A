import { makeDataSource } from '@jobsearch/common';
import { Application } from './models/application.entity';

export const dataSource = makeDataSource([Application]);
