import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Review } from './entities/Review';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './reviews.sqlite',
  synchronize: true,
  logging: false,
  entities: [Review],
});
