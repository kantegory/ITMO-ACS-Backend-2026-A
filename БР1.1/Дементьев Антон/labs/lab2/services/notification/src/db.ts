import { makeDataSource } from '@jobsearch/common';
import { EmailLog } from './models/email-log.entity';

export const dataSource = makeDataSource([EmailLog]);
