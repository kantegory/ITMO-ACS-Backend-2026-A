import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("cuisines")
export class Cuisine {
  @PrimaryGeneratedColumn({ name: "cuisine_id", type: "integer" })
  cuisineId!: number;

  @Column({ type: "varchar", unique: true, length: 100 })
  name!: string;

  @ManyToMany(() => Restaurant, (restaurant) => restaurant.cuisines)
  restaurants!: Restaurant[];
}
