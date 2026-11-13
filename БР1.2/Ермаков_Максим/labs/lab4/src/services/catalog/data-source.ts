import { DataSource } from 'typeorm';
import { SETTINGS } from '../../common/settings';
import { Cuisine, Location, Restaurant, RestaurantPhoto } from './entities';

export const catalogDataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.CATALOG_DB_NAME,
    entities: [Location, Cuisine, Restaurant, RestaurantPhoto],
    logging: false,
    synchronize: true,
});
