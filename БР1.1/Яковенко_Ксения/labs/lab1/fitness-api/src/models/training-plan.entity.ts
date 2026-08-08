import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { DifficultyLevel } from './difficulty-level.entity';
import { User } from './user.entity';
import { PlanWorkout } from './plan-workout.entity';

@Entity('training_plans')
export class TrainingPlan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: false })
  difficultyLevelId!: number;

  @ManyToOne(() => DifficultyLevel, { nullable: false, onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'difficultyLevelId' })
  difficultyLevel!: DifficultyLevel;

  @Column({ type: 'int', nullable: false })
  durationWeeks!: number;

  @Column({ type: 'int', nullable: false })
  authorId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @OneToMany(() => PlanWorkout, (planWorkout) => planWorkout.plan)
  planWorkouts!: PlanWorkout[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}