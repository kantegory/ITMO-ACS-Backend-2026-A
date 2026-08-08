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

@Entity('body_metrics')
export class BodyMetric extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  userId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'date', nullable: false })
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