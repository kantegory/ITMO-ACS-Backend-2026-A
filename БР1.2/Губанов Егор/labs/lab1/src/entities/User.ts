import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Property } from "./Property";
import { Deal } from "./Deal";
import { Message } from "./Message";

export type Role = "TENANT" | "OWNER" | "ADMIN";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20 })
  role!: Role;

  @Column({ name: "first_name" })
  firstName!: string;

  @Column({ name: "last_name" })
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ name: "is_verified", default: false })
  isVerified!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => Property, (p) => p.owner)
  properties!: Property[];

  @OneToMany(() => Deal, (d) => d.tenant)
  dealsAsTenant!: Deal[];

  @OneToMany(() => Message, (m) => m.sender)
  sentMessages!: Message[];

  @OneToMany(() => Message, (m) => m.receiver)
  receivedMessages!: Message[];
}
