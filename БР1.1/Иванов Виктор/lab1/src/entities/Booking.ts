import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Restaurant } from "./Restaurant";
import { Table } from "./Table";

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

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.bookings)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.bookings)
  @JoinColumn({ name: "table_id" })
  table: Table;
}
