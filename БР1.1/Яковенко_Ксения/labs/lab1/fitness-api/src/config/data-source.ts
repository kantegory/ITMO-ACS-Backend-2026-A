import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { User } from '../models/user.entity';
import { UserProfile } from '../models/user-profile.entity';
import { DifficultyLevel } from '../models/difficulty-level.entity';
import { WorkoutType } from '../models/workout-type.entity';
import { Workout } from '../models/workout.entity';
import { TrainingPlan } from '../models/training-plan.entity';
import { PlanWorkout } from '../models/plan-workout.entity';
import { UserTrainingPlan } from '../models/user-training-plan.entity';
import { BodyMetric } from '../models/body-metric.entity';
import { WorkoutSession } from '../models/workout-session.entity';
import { RevokedToken } from '../models/revoked-token.entity';
import { BlogCategory } from '../models/blog-category.entity';
import { BlogPost } from '../models/blog-post.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: Number(SETTINGS.DB_PORT),
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [
  User,
  UserProfile,
  DifficultyLevel,
  WorkoutType,
  Workout,
  TrainingPlan,
  PlanWorkout,
  UserTrainingPlan,
  BodyMetric,
  WorkoutSession,
  RevokedToken,
  BlogCategory,
  BlogPost,
],
    subscribers: [],
    logging: true,
    synchronize: true,
});

export default dataSource;