import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
import { Property } from "./Property";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "sender_id" })
  senderId!: string;

  @ManyToOne(() => User, (u) => u.sentMessages)
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @Column({ name: "receiver_id" })
  receiverId!: string;

  @ManyToOne(() => User, (u) => u.receivedMessages)
  @JoinColumn({ name: "receiver_id" })
  receiver!: User;

  @Column({ name: "property_id" })
  propertyId!: string;

  @ManyToOne(() => Property, (p) => p.messages)
  @JoinColumn({ name: "property_id" })
  property!: Property;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "is_read", default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
