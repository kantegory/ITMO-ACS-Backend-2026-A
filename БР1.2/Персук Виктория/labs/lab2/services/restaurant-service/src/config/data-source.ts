import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Restaurant } from '../models/restaurant.entity';
import { Cuisine } from '../models/cuisine.entity';
import { RestaurantCuisine } from '../models/restaurant-cuisine.entity';
import { RestaurantOwner } from '../models/restaurant-owner.entity';
import { RestaurantStaff } from '../models/restaurant-staff.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Restaurant, Cuisine, RestaurantCuisine, RestaurantOwner, RestaurantStaff, RestaurantPhoto],
    logging: true,
    synchronize: true,
});

export default dataSource;
