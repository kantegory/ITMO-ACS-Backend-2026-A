import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { DifficultyLevel } from './entities/difficulty-level.entity';
import { WorkoutType } from './entities/workout-type.entity';
import { Workout } from './entities/workout.entity';

const db = databaseEnv('CATALOG');

export const catalogDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [DifficultyLevel, WorkoutType, Workout],
  synchronize: true,
  logging: false,
});
