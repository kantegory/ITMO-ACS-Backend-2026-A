import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { User } from '../models/user.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [User],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: true,
    synchronize: true,
});

export default dataSource;
