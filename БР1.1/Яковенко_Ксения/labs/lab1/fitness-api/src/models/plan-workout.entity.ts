import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { TrainingPlan } from './training-plan.entity';
import { Workout } from './workout.entity';

@Entity('plan_workouts')
export class PlanWorkout extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  planId!: number;

  @ManyToOne(() => TrainingPlan, (plan) => plan.planWorkouts, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'planId' })
  plan!: TrainingPlan;

  @Column({ type: 'int', nullable: false })
  workoutId!: number;

  @ManyToOne(() => Workout, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'workoutId' })
  workout!: Workout;

  @Column({ type: 'int', nullable: false })
  weekNo!: number;

  @Column({ type: 'int', nullable: false })
  dayNo!: number;

  @Column({ type: 'int', nullable: false })
  orderNo!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string;
}