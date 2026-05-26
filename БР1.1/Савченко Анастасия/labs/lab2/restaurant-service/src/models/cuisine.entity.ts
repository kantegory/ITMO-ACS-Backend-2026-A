import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { RestaurantCuisine } from "./restaurant-cuisine.entity"

@Entity("cuisines")
export class Cuisine {
  @PrimaryGeneratedColumn()
  cuisine_id: number

  @Column({ type: "varchar", unique: true })
  cuisine_name: string

  @OneToMany(() => RestaurantCuisine, rc => rc.cuisine)
  restaurantCuisines: RestaurantCuisine[]
}