import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../entities/User';
import { Cuisine } from '../entities/Cuisine';
import { Restaurant } from '../entities/Restaurant';
import { RestaurantPhoto } from '../entities/RestaurantPhoto';
import { MenuItem } from '../entities/MenuItem';
import { RestaurantTable } from '../entities/RestaurantTable';
import { Reservation } from '../entities/Reservation';
import { Review } from '../entities/Review';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './database.sqlite',
  synchronize: true,
  logging: false,
  entities: [
    User,
    Cuisine,
    Restaurant,
    RestaurantPhoto,
    MenuItem,
    RestaurantTable,
    Reservation,
    Review,
  ],
});
