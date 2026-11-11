import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Restaurant } from './entities/Restaurant';
import { Cuisine } from './entities/Cuisine';
import { RestaurantPhoto } from './entities/RestaurantPhoto';
import { MenuItem } from './entities/MenuItem';
import { RestaurantTable } from './entities/RestaurantTable';
import { dbOptions } from './db';

// SQLite (dev/compose) или PostgreSQL (k8s) — в зависимости от DATABASE_URL, см. db.ts
export const AppDataSource = new DataSource(dbOptions('./catalog.sqlite', [Restaurant, Cuisine, RestaurantPhoto, MenuItem, RestaurantTable]));
