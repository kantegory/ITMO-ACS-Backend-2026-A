import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Property } from "./Property";
import { User } from "./User";

export type DealStatus = "PENDING" | "ACTIVE" | "COMPLETED";

@Entity("deals")
export class Deal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id" })
  propertyId!: string;

  @ManyToOne(() => Property, (p) => p.deals)
  @JoinColumn({ name: "property_id" })
  property!: Property;

  @Column({ name: "tenant_id" })
  tenantId!: string;

  @ManyToOne(() => User, (u) => u.dealsAsTenant)
  @JoinColumn({ name: "tenant_id" })
  tenant!: User;

  @Column({ type: "varchar", length: 20 })
  status!: DealStatus;

  @Column({ name: "start_date", type: "timestamptz" })
  startDate!: Date;

  @Column({ name: "end_date", type: "timestamptz" })
  endDate!: Date;

  @Column({ name: "total_price", type: "decimal", precision: 14, scale: 2 })
  totalPrice!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
