import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Property } from "./Property";
import { Message } from "./Message";

export type RentalStatus = "active" | "completed" | "cancelled";

@Entity("rentals")
export class Rental {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ name: "start_date", type: "date" })
  startDate: string;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: string;

  @Column({ type: "varchar", length: 16, default: "active" })
  status: RentalStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Property, (p) => p.rentals, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "property_id" })
  property: Property;

  @ManyToOne(() => User, (u) => u.rentals, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: User;

  @OneToMany(() => Message, (m) => m.rental)
  messages: Message[];
}
