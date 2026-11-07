import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import {
  Category, Comment, Cuisine, Favorite, Follow, Ingredient, Like, Recipe,
  RecipeIngredient, RecipeMedia, RecipeStep, Tag, User,
} from '../models';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: env.db.synchronize,
  logging: env.db.logging,
  entities: [
    User, Category, Cuisine, Tag, Ingredient, Recipe, RecipeIngredient,
    RecipeStep, RecipeMedia, Comment, Like, Favorite, Follow,
  ],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
