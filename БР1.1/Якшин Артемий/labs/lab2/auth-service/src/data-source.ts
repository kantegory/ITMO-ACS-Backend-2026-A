import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './auth.sqlite',
  synchronize: true,
  logging: false,
  entities: [User],
});
