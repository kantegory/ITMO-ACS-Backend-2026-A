import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RestaurantTable } from "./RestaurantTable";
import { User } from "./User";

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn({ name: "reservation_id", type: "integer" })
  reservationId!: number;

  @ManyToOne(() => User, (user) => user.reservations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => RestaurantTable, (table) => table.reservations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "table_id" })
  table!: RestaurantTable;

  @Column({ type: "varchar", name: "reservation_date", length: 10 })
  reservationDate!: string;

  @Column({ type: "varchar", name: "start_time", length: 8 })
  startTime!: string;

  @Column({ type: "varchar", name: "end_time", length: 8 })
  endTime!: string;

  @Column({ type: "integer", name: "guests_count" })
  guestsCount!: number;

  @Column({ type: "varchar", length: 20, default: "confirmed" })
  status!: ReservationStatus;

  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt!: Date;
}
