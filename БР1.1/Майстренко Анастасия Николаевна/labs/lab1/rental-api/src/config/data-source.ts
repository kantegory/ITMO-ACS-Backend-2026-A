import { DataSource, DataSourceOptions } from 'typeorm';
import SETTINGS from './settings';

const common = {
    entities: [SETTINGS.DB_ENTITIES],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: false,
    synchronize: true,
};

let options: DataSourceOptions;

if (SETTINGS.DB_TYPE === 'sqlite') {
    // Локальный запуск без внешней БД (для разработки и проверки)
    options = {
        type: 'better-sqlite3',
        database: 'dbs/rental.sqlite',
        ...common,
    } as DataSourceOptions;
} else {
    options = {
        type: 'postgres',
        host: SETTINGS.DB_HOST,
        port: SETTINGS.DB_PORT,
        username: SETTINGS.DB_USER,
        password: SETTINGS.DB_PASSWORD,
        database: SETTINGS.DB_NAME,
        ...common,
    } as DataSourceOptions;
}

const dataSource = new DataSource(options);

export default dataSource;
