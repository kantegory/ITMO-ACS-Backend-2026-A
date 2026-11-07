import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export type RentalStatus = "active" | "completed" | "cancelled";

@Entity("rentals")
export class Rental {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  // Внешние идентификаторы — указывают на сущности из других сервисов.
  // FK не задаём: пересечение БД сервисов запрещено по архитектуре.
  @Column({ name: "property_id", type: "bigint" })
  propertyId: string;

  @Column({ name: "tenant_id", type: "bigint" })
  tenantId: string;

  @Column({ name: "owner_id", type: "bigint" })
  ownerId: string;

  // Снапшоты на момент создания сделки — чтобы не дёргать property-service
  // ради базовой информации в списке "мои сделки".
  @Column({ name: "property_title_snapshot" })
  propertyTitleSnapshot: string;

  @Column({ name: "property_city_snapshot" })
  propertyCitySnapshot: string;

  @Column({ name: "price_per_month_snapshot", type: "numeric", precision: 12, scale: 2 })
  pricePerMonthSnapshot: string;

  @Column({ name: "start_date", type: "date" })
  startDate: string;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: string;

  @Column({ type: "varchar", length: 16, default: "active" })
  status: RentalStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
