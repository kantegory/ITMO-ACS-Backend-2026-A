import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { PropertyType } from "./PropertyType";
import { Location } from "./Location";
import { PropertyPhoto } from "./PropertyPhoto";
import { Amenity } from "./Amenity";

@Entity("properties")
export class Property {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  // Внешний идентификатор владельца, ссылается на пользователя в identity-service.
  // FK не используем намеренно — пересечение БД сервисов запрещено.
  @Column({ name: "owner_id", type: "bigint" })
  ownerId: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ name: "price_per_month", type: "numeric", precision: 12, scale: 2 })
  pricePerMonth: string;

  @Column({ name: "area_sqm", type: "numeric", precision: 8, scale: 2, nullable: true })
  areaSqm: string;

  @Column({ type: "int", nullable: true })
  rooms: number;

  @Column({ name: "rental_conditions", type: "text", nullable: true })
  rentalConditions: string;

  @Column({ name: "is_available", default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => PropertyType, { eager: true })
  @JoinColumn({ name: "property_type_id" })
  propertyType: PropertyType;

  @OneToOne(() => Location, { eager: true, cascade: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "location_id" })
  location: Location;

  @OneToMany(() => PropertyPhoto, (ph) => ph.property, { cascade: true })
  photos: PropertyPhoto[];

  @ManyToMany(() => Amenity, (a) => a.properties, { eager: true })
  @JoinTable({
    name: "property_amenities",
    joinColumn: { name: "property_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "amenity_id", referencedColumnName: "id" },
  })
  amenities: Amenity[];
}
