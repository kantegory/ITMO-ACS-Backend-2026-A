import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn({ name: 'reservation_id' })
  reservation_id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  // ссылки на сущности других сервисов — без FK (database-per-service)
  @Column({ type: 'integer' })
  table_id!: number;

  @Column({ type: 'integer' })
  restaurant_id!: number;

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
}
