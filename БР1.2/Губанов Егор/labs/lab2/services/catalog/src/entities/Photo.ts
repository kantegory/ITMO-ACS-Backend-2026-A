import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Property } from "./Property";

@Entity("photos")
export class Photo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "property_id" })
  propertyId!: string;

  @ManyToOne(() => Property, (p) => p.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  @Column({ name: "photo_url" })
  photoUrl!: string;

  @Column({ name: "is_main", default: false })
  isMain!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
