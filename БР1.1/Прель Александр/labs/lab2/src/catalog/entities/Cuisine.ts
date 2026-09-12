import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("cuisines")
export class Cuisine {
  @PrimaryGeneratedColumn({ name: "cuisine_id" })
  cuisineId!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @ManyToMany(() => Restaurant, (restaurant) => restaurant.cuisines)
  restaurants!: Restaurant[];
}
