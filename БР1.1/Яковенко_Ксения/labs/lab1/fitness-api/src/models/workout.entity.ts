import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';

import { DifficultyLevel } from './difficulty-level.entity';
import { WorkoutType } from './workout-type.entity';
import { User } from './user.entity';

@Entity('workouts')
export class Workout extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'int', nullable: false })
  durationMin!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl?: string;

  @Column({ type: 'int', nullable: true })
  caloriesEstimate?: number;

  @Column({ type: 'int', nullable: false })
  difficultyLevelId!: number;

  @ManyToOne(() => DifficultyLevel, { nullable: false, onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'difficultyLevelId' })
  difficultyLevel!: DifficultyLevel;

  @Column({ type: 'int', nullable: false })
  authorId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @ManyToMany(() => WorkoutType, { eager: true })
  @JoinTable({
    name: 'workout_type_map',
    joinColumn: {
      name: 'workoutId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'workoutTypeId',
      referencedColumnName: 'id',
    },
  })
  types!: WorkoutType[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}