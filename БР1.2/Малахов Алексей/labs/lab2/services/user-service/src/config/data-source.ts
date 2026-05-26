import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { User } from '../models/user.entity';
import { UserRoleEntity } from '../models/user-role.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [User, UserRoleEntity],
    logging: false,
    synchronize: true,
});

export default dataSource;
