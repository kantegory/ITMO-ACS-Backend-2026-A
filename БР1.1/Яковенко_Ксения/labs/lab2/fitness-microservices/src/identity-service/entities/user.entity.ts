import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';

export type UserRole = 'user' | 'trainer' | 'admin';
export type UserStatus = 'active' | 'blocked';

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 300, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 30, default: 'user' })
  role!: UserRole;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: UserStatus;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
