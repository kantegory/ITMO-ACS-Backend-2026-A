import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { LandlordReview } from '../models/landlord-review.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [LandlordReview],
    logging: false,
    synchronize: true,
});

export default dataSource;
