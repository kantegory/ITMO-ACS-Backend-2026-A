import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Property } from "./Property";

@Entity("property_photos")
export class PropertyPhoto {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column()
  url: string;

  @Column({ name: "sort_order", default: 0 })
  sortOrder: number;

  @ManyToOne(() => Property, (p) => p.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "property_id" })
  property: Property;
}
