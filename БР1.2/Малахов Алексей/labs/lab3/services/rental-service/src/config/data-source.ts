import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Rental } from '../models/rental.entity';
import { Transaction } from '../models/transaction.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Rental, Transaction],
    logging: false,
    synchronize: true,
});

export default dataSource;
