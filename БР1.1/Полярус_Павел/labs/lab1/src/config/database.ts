import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'jobby',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  synchronize: true,
  logging: false,
  entities: [
    process.env.NODE_ENV === 'production'
      ? 'dist/entities/*.js'
      : 'src/entities/*.ts',
  ],
});
