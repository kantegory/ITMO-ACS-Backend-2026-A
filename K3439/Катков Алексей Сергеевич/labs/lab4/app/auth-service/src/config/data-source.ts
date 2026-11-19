import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { ENTITIES } from '../models';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: ENTITIES,
    subscribers: [],
    logging: ['error'],
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    extra: { connectionTimeoutMillis: 2000, query_timeout: 2000 },
});
export default dataSource;
