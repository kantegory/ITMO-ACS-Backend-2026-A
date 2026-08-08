import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrainingPlan } from './training-plan.entity';

@Entity('plan_workouts')
export class PlanWorkout extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  planId!: number;

  @ManyToOne(() => TrainingPlan, (plan) => plan.planWorkouts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan!: TrainingPlan;

  @Column({ type: 'int' })
  workoutId!: number;

  @Column({ type: 'int' })
  weekNo!: number;

  @Column({ type: 'int' })
  dayNo!: number;

  @Column({ type: 'int' })
  orderNo!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string;
}
