import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Rental } from "./Rental";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Rental, (r) => r.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "rental_id" })
  rental: Rental;

  @ManyToOne(() => User, (u) => u.messages, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "sender_id" })
  sender: User;
}
