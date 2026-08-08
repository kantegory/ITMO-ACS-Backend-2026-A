import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainingPlan } from './training-plan.entity';

export type UserTrainingPlanStatus = 'active' | 'completed' | 'cancelled';

@Entity('user_training_plans')
export class UserTrainingPlan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  planId!: number;

  @ManyToOne(() => TrainingPlan, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  trainingPlan!: TrainingPlan;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: UserTrainingPlanStatus;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'int', default: 0 })
  progressPercent!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
