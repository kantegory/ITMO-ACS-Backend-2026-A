import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("booking_event_log")
export class BookingEventLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  booking_id: string;

  @Column({ type: "text" })
  payload_json: string;

  @CreateDateColumn()
  created_at: Date;
}
