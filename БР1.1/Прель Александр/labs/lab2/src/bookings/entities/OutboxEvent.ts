import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("outbox_events")
export class OutboxEvent {
  @PrimaryGeneratedColumn() sequence!: number;
  @Column({ name: "event_id", type: "text", unique: true }) eventId!: string;
  @Column({ type: "text" }) payload!: string;
  @Index()
  @Column({ name: "published_at", type: "text", nullable: true }) publishedAt!: string | null;
}
