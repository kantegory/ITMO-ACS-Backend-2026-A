import { DataSource } from 'typeorm';
import SETTINGS from './settings';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [SETTINGS.DB_ENTITIES],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: true,
    synchronize: true,
});

export default dataSource;
