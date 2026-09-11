import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import type { Role } from "@fitflow/shared";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index({ unique: true }) @Column({ length: 254 }) email!: string;
  @Column({ name: "password_hash" }) passwordHash!: string;
  @Column({ length: 100 }) name!: string;
  @Column({ type: "varchar", default: "user" }) role!: Role;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}
