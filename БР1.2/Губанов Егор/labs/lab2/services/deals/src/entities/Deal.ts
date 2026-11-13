import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type DealStatus = "PENDING" | "ACTIVE" | "COMPLETED";

@Entity("deals")
export class Deal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id" })
  propertyId!: string;

  @Column({ name: "tenant_id" })
  tenantId!: string;

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
