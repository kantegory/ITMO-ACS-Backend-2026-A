import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseEnv } from '../shared/env';
import { TrainingPlan } from './entities/training-plan.entity';
import { PlanWorkout } from './entities/plan-workout.entity';
import { UserTrainingPlan } from './entities/user-training-plan.entity';

const db = databaseEnv('PLANS');

export const plansDataSource = new DataSource({
  type: 'postgres',
  ...db,
  entities: [TrainingPlan, PlanWorkout, UserTrainingPlan],
  synchronize: true,
  logging: false,
});
