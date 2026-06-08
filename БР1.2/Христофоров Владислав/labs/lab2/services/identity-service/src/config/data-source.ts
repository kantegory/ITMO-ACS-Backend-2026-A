import 'reflect-metadata';
import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { User } from '../models/user.entity';
import { UserSubscriber } from '../models/user.subscriber';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User],
    subscribers: [UserSubscriber],
});

export default dataSource;
