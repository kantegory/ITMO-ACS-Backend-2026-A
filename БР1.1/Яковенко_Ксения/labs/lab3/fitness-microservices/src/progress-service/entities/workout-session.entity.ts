import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workout_sessions')
export class WorkoutSession extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  workoutId!: number;

  @Column({ type: 'int', nullable: true })
  userTrainingPlanId?: number;

  @Column({ type: 'timestamp' })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int' })
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
