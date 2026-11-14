import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Cuisine } from '../models/cuisine.entity';
import { Location } from '../models/location.entity';
import { MenuCategory } from '../models/menu-category.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Reservation } from '../models/reservation.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { Restaurant } from '../models/restaurant.entity';
import { Review } from '../models/review.entity';
import { User } from '../models/user.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [
        User,
        Location,
        Cuisine,
        Restaurant,
        RestaurantPhoto,
        RestaurantTable,
        MenuCategory,
        MenuItem,
        Review,
        Reservation,
    ],
    logging: true,
    synchronize: true,
});

export default dataSource;
