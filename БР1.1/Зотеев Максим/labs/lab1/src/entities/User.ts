import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Property } from "./Property";
import { Rental } from "./Rental";
import { Message } from "./Message";

export type UserRole = "tenant" | "landlord";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: "varchar", length: 16 })
  role: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => Property, (p) => p.owner)
  properties: Property[];

  @OneToMany(() => Rental, (r) => r.tenant)
  rentals: Rental[];

  @OneToMany(() => Message, (m) => m.sender)
  messages: Message[];
}
