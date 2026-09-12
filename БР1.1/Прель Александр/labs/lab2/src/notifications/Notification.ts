import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("notifications")
export class Notification {
  @PrimaryColumn({ name: "event_id", type: "text" }) eventId!: string;
  @Index()
  @Column({ name: "user_id", type: "integer" }) userId!: number;
  @Column({ name: "reservation_id", type: "integer" }) reservationId!: number;
  @Column({ type: "text" }) type!: string;
  @Column({ type: "text" }) message!: string;
  @Column({ name: "occurred_at", type: "text" }) occurredAt!: string;
  @Column({ name: "received_at", type: "text" }) receivedAt!: string;
}
