import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { TrainingPlan } from './training-plan.entity';

export type UserTrainingPlanStatus = 'active' | 'completed' | 'cancelled';

@Entity('user_training_plans')
export class UserTrainingPlan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  userId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int', nullable: false })
  planId!: number;

  @ManyToOne(() => TrainingPlan, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'planId' })
  trainingPlan!: TrainingPlan;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: UserTrainingPlanStatus;

  @Column({ type: 'date', nullable: false })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  progressPercent!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}