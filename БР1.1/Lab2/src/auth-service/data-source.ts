import 'reflect-metadata';

import { DataSource } from 'typeorm';

import SETTINGS from '../shared/settings';
import { User } from './entities/user.entity';

const authDataSource = new DataSource({
    type: 'postgres',
    ...SETTINGS.AUTH_DB,
    entities: [User],
    logging: true,
    synchronize: true,
});

export default authDataSource;
