import { DataSource } from 'typeorm';
import { SETTINGS } from '../../common/settings';
import { MenuCategory, MenuItem } from './entities';

export const menuDataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.MENU_DB_NAME,
    entities: [MenuCategory, MenuItem],
    logging: false,
    synchronize: true,
});
