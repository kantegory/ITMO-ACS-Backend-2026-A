import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogPost } from './entities/blog-post.entity';

const db = databaseEnv('CONTENT');

export const contentDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [BlogCategory, BlogPost],
  synchronize: true,
  logging: false,
});
