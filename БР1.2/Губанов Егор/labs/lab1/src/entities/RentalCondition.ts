import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Property } from "./Property";

@Entity("rental_conditions")
export class RentalCondition {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id" })
  propertyId!: string;

  @ManyToOne(() => Property, (p) => p.conditions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  @Column({ type: "text" })
  text!: string;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
