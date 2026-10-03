import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity
} from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';
import { RestaurantTable } from './table.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

@Entity('reservations')
export class Reservation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @ManyToOne(() => User, (u) => u.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  restaurant_id: string;

  @ManyToOne(() => Restaurant, (r) => r.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'uuid', nullable: false })
  table_id: string;

  @ManyToOne(() => RestaurantTable, (t) => t.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: RestaurantTable;

  @Column({ type: 'date', nullable: false })
  reservation_date: string;

  @Column({ type: 'time', nullable: false })
  start_time: string;

  @Column({ type: 'time', nullable: false })
  end_time: string;

  @Column({ type: 'int', nullable: false, default: 2 })
  guests_count: number;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  special_requests: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
