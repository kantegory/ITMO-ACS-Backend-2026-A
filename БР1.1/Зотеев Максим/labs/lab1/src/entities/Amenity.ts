import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Property } from "./Property";

@Entity("amenities")
export class Amenity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @ManyToMany(() => Property, (p) => p.amenities)
  properties: Property[];
}
