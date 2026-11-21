import { DataSource } from 'typeorm';
import { SETTINGS } from '../../common/settings';
import { User } from './user.entity';

export const identityDataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.IDENTITY_DB_NAME,
    entities: [User],
    logging: false,
    synchronize: true,
});
