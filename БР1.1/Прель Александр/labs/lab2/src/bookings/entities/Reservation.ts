import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

@Entity("reservations")
@Index(["tableId", "reservationDate", "status"])
export class Reservation {
  @PrimaryGeneratedColumn({ name: "reservation_id" }) reservationId!: number;
  @Column({ name: "user_id", type: "integer" }) userId!: number;
  @Column({ name: "restaurant_id", type: "integer" }) restaurantId!: number;
  @Column({ name: "restaurant_name", type: "text" }) restaurantName!: string;
  @Column({ name: "table_id", type: "integer" }) tableId!: number;
  @Column({ name: "table_number", type: "text" }) tableNumber!: string;
  @Column({ name: "reservation_date", type: "text" }) reservationDate!: string;
  @Column({ name: "start_time", type: "text" }) startTime!: string;
  @Column({ name: "end_time", type: "text" }) endTime!: string;
  @Column({ name: "guests_count", type: "integer" }) guestsCount!: number;
  @Column({ type: "text", default: "confirmed" }) status!: ReservationStatus;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}
