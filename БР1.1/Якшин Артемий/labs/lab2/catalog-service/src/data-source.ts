import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Restaurant } from './entities/Restaurant';
import { Cuisine } from './entities/Cuisine';
import { RestaurantPhoto } from './entities/RestaurantPhoto';
import { MenuItem } from './entities/MenuItem';
import { RestaurantTable } from './entities/RestaurantTable';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './catalog.sqlite',
  synchronize: true,
  logging: false,
  entities: [Restaurant, Cuisine, RestaurantPhoto, MenuItem, RestaurantTable],
});
