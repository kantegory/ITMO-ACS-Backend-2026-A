import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { BodyMetric } from './entities/body-metric.entity';
import { WorkoutSession } from './entities/workout-session.entity';

const db = databaseEnv('PROGRESS');

export const progressDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [BodyMetric, WorkoutSession],
  synchronize: true,
  logging: false,
});
