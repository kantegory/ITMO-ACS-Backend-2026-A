import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "sender_id" })
  senderId!: string;

  @Column({ name: "receiver_id" })
  receiverId!: string;

  @Column({ name: "property_id" })
  propertyId!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "is_read", default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
