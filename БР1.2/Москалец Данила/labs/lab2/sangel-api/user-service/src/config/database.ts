import { DataSource } from 'typeorm';
import { settings } from './settings';
import { User } from '../entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: settings.db.host,
  port: settings.db.port,
  username: settings.db.user,
  password: settings.db.password,
  database: settings.db.name,
  synchronize: settings.isDev,
  logging: settings.isDev,
  entities: [User],
});