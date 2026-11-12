import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("notification_log")
export class NotificationLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  booking_id: string;

  @Column({ type: "text" })
  message_json: string;

  @CreateDateColumn()
  created_at: Date;
}
