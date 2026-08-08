import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';

@Entity('user_profiles')
export class UserProfile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', unique: true })
  userId!: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ type: 'int', nullable: true })
  heightCm?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fitnessGoal?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;
}