import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { settings } from './settings';
import { Review } from '../models/review.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: settings.db.host,
  port: settings.db.port,
  username: settings.db.user,
  password: settings.db.password,
  database: settings.db.name,
  entities: [Review],
  synchronize: true,
  logging: false,
});
