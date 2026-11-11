import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { RestaurantTable } from './RestaurantTable';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn({ name: 'reservation_id' })
  reservation_id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'integer' })
  table_id!: number;

  @Column({ type: 'date' })
  reservation_date!: string;

  @Column({ type: 'varchar', length: 5 })
  reservation_time!: string;

  @Column({ type: 'integer' })
  guests_count!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: ReservationStatus;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => User, (u) => u.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => RestaurantTable, (t) => t.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table!: RestaurantTable;
}
