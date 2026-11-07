import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { Comment, Favorite, Like, ProcessedEvent, RecipeProjection, UserProjection } from '../models';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: env.db.synchronize,
  logging: env.db.logging,
  entities: [Like, Favorite, Comment, RecipeProjection, UserProjection, ProcessedEvent],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  return AppDataSource;
};
