import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn()
  booking_id: number

  @Column({ type: "int" })
  user_id: number

  @Column({ type: "int" })
  restaurant_id: number

  @Column({ type: "int" })
  table_id: number

  @Column({ type: "date" })
  date: string

  @Column({ type: "time" })
  reservation_start: string

  @Column({ type: "time" })
  reservation_end: string

  @Column({ type: "int" })
  party_size: number

  @Column({ type: "varchar", default: "pending" })
  state: string

  @Column({ type: "text", nullable: true })
  notes: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}