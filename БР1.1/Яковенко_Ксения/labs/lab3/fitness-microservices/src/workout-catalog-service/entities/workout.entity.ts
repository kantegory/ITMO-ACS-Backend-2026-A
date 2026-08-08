import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DifficultyLevel } from './difficulty-level.entity';
import { WorkoutType } from './workout-type.entity';

@Entity('workouts')
export class Workout extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'int' })
  durationMin!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl?: string;

  @Column({ type: 'int', nullable: true })
  caloriesEstimate?: number;

  @Column({ type: 'int' })
  difficultyLevelId!: number;

  @ManyToOne(() => DifficultyLevel, (difficulty) => difficulty.workouts, {
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'difficultyLevelId' })
  difficultyLevel!: DifficultyLevel;

  @Column({ type: 'int' })
  authorId!: number;

  @ManyToMany(() => WorkoutType, (type) => type.workouts, { eager: true })
  @JoinTable({
    name: 'workout_type_map',
    joinColumn: { name: 'workoutId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'workoutTypeId', referencedColumnName: 'id' },
  })
  types!: WorkoutType[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
