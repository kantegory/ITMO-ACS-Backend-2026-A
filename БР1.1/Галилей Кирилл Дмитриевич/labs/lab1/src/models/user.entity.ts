import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BaseEntity
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Reservation } from './reservation.entity';
import { Review } from './review.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  password_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  full_name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Restaurant, (r) => r.manager)
  managed_restaurants: Restaurant[];

  @OneToMany(() => Reservation, (res) => res.user)
  reservations: Reservation[];

  @OneToMany(() => Review, (rev) => rev.user)
  reviews: Review[];
}
