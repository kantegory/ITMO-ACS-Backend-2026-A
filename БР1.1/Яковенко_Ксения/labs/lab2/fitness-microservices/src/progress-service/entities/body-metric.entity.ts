import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('body_metrics')
export class BodyMetric extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'date' })
  measuredAt!: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weightKg?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  chestCm?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  waistCm?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  hipsCm?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bodyFatPercent?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comment?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
