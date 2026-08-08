import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';

@Entity('difficulty_levels')
export class DifficultyLevel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  name!: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  sortOrder!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;
}