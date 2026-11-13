import { DataSource } from 'typeorm';
import { SETTINGS } from '../../common/settings';
import { Review } from './review.entity';

export const reviewDataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.REVIEW_DB_NAME,
    entities: [Review],
    logging: false,
    synchronize: true,
});
