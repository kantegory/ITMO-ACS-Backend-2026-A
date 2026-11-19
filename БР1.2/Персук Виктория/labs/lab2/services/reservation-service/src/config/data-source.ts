import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Table } from '../models/table.entity';
import { Reservation } from '../models/reservation.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Table, Reservation],
    logging: true,
    synchronize: true,
    // в AWS RDS (PostgreSQL 16) подключение разрешено только по TLS
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export default dataSource;
