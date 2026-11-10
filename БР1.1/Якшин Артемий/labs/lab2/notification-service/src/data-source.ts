import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Notification } from './entities/Notification';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './notifications.sqlite',
  synchronize: true,
  logging: false,
  entities: [Notification],
});
