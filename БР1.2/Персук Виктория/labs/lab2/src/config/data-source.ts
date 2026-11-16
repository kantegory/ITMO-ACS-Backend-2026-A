import { DataSource } from 'typeorm';
import SETTINGS from './settings';

import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantOwner } from '../models/restaurant-owner.entity';
import { RestaurantStaff } from '../models/restaurant-staff.entity';
import { Table } from '../models/table.entity';
import { Reservation } from '../models/reservation.entity';
import { Cuisine } from '../models/cuisine.entity';
import { RestaurantCuisine } from '../models/restaurant-cuisine.entity';
import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { Menu } from '../models/menu.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Review } from '../models/review.entity';
import { UserSubscriber } from '../models/user.subscriber';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [
        User,
        Role,
        Restaurant,
        RestaurantOwner,
        RestaurantStaff,
        Table,
        Reservation,
        Cuisine,
        RestaurantCuisine,
        RestaurantPhoto,
        Menu,
        MenuItem,
        Review,
    ],
    subscribers: [UserSubscriber],
    logging: true,
    synchronize: true,
});

export default dataSource;
