import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column()
  restaurant_id: string;

  @Column()
  table_id: string;

  @Column()
  booking_date: string;

  @Column()
  booking_time: string;

  @Column({ type: "int" })
  guests_count: number;

  @Column({ type: "varchar", default: BookingStatus.PENDING })
  status: BookingStatus;

  @CreateDateColumn()
  created_at: Date;
}
