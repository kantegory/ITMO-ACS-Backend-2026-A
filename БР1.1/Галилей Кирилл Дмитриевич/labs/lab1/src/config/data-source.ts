import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SETTINGS } from './settings';
import { User } from '../models/user.entity';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantTable } from '../models/table.entity';
import { Reservation } from '../models/reservation.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Review } from '../models/review.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: SETTINGS.DB_HOST,
  port: SETTINGS.DB_PORT,
  username: SETTINGS.DB_USER,
  password: SETTINGS.DB_PASSWORD,
  database: SETTINGS.DB_NAME,
  synchronize: true, // автоматически синхронизирует схемы в режиме dev
  logging: false,
  entities: [User, Restaurant, RestaurantTable, Reservation, MenuItem, Review]
});
