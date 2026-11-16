import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { UserSubscriber } from '../models/user.subscriber';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [User, Role],
    subscribers: [UserSubscriber],
    logging: true,
    synchronize: true,
});

export default dataSource;
