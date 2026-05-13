import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Reservation } from './entities/Reservation';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './reservations.sqlite',
  synchronize: true,
  logging: false,
  entities: [Reservation],
});
