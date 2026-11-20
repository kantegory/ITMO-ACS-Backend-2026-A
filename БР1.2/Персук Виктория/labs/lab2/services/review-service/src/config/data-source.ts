import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Review } from '../models/review.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Review],
    // логирование SQL и размер пула подключений настраиваются из окружения (ЛР8)
    logging: process.env.DB_LOGGING !== 'false',
    synchronize: true,
    // в AWS RDS (PostgreSQL 16) подключение разрешено только по TLS
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    extra: { max: parseInt(process.env.DB_POOL_MAX || '10') },
});

export default dataSource;
