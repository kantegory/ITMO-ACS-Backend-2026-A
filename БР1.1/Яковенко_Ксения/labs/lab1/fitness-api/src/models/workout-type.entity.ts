import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';

@Entity('workout_types')
export class WorkoutType extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;
}