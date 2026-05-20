import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { RestaurantCuisine } from "./restaurant-cuisine.entity" // для связи M:N

@Entity("cuisines")       
export class Cuisine {
  @PrimaryGeneratedColumn()
  cuisine_id: number      

  @Column({ type: "varchar", unique: true }) // значение должно быть уникальным название: "Итальянская", "Японская" и т.д.
  cuisine_name: string     

  // связь с ассоциативной таблицей RestaurantCuisine
  // ОДНА кухня может быть у МНОГИХ ресторанов
  @OneToMany(() => RestaurantCuisine, rc => rc.cuisine)
  restaurantCuisines: RestaurantCuisine[]
  // это поле не хранится в БД, оно для TypeORM — чтобы делать JOIN-запросы
}