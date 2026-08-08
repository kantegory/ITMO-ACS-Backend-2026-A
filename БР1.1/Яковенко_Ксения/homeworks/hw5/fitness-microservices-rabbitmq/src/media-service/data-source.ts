import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { MediaFile } from './entities/media-file.entity';

const db = databaseEnv('MEDIA');

export const mediaDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [MediaFile],
  synchronize: true,
  logging: false,
});
