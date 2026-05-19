import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

export type MessageKind = "user" | "system";

@Entity("messages")
@Index(["rentalId", "createdAt"])
export class Message {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  // Внешний идентификатор сделки из rental-service.
  @Column({ name: "rental_id", type: "bigint" })
  rentalId: string;

  // Для системных сообщений (из событий) sender_id отсутствует.
  @Column({ name: "sender_id", type: "bigint", nullable: true })
  senderId: string | null;

  @Column({ type: "varchar", length: 16, default: "user" })
  kind: MessageKind;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
