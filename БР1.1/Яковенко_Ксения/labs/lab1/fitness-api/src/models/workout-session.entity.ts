import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Workout } from './workout.entity';
import { UserTrainingPlan } from './user-training-plan.entity';

@Entity('workout_sessions')
export class WorkoutSession extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  userId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int', nullable: false })
  workoutId!: number;

  @ManyToOne(() => Workout, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'workoutId' })
  workout!: Workout;

  @Column({ type: 'int', nullable: true })
  userTrainingPlanId?: number;

  @ManyToOne(() => UserTrainingPlan, { nullable: true, onDelete: 'SET NULL', eager: false })
  @JoinColumn({ name: 'userTrainingPlanId' })
  userTrainingPlan?: UserTrainingPlan;

  @Column({ type: 'timestamp', nullable: false })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', nullable: false })
  durationFactMin!: number;

  @Column({ type: 'int', nullable: true })
  caloriesFact?: number;

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;
}