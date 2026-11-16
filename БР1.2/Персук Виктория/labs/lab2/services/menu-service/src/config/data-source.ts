import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Menu } from '../models/menu.entity';
import { MenuItem } from '../models/menu-item.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Menu, MenuItem],
    logging: true,
    synchronize: true,
});

export default dataSource;
