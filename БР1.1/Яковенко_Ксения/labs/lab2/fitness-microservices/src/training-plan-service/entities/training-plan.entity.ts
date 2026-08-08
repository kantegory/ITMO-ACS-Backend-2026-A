import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanWorkout } from './plan-workout.entity';

@Entity('training_plans')
export class TrainingPlan extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  difficultyLevelId!: number;

  @Column({ type: 'int' })
  durationWeeks!: number;

  @Column({ type: 'int' })
  authorId!: number;

  @OneToMany(() => PlanWorkout, (planWorkout) => planWorkout.plan)
  planWorkouts!: PlanWorkout[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
