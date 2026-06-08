import { DataSource } from 'typeorm';
import { settings } from './settings';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: settings.db.host,
  port: settings.db.port,
  username: settings.db.user,
  password: settings.db.password,
  database: settings.db.name,
  synchronize: false,
  logging: settings.isDev,
  entities: [`${__dirname}/../modules/**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/../migrations/*.{ts,js}`],
  subscribers: [`${__dirname}/../modules/**/*.subscriber.{ts,js}`],
});
