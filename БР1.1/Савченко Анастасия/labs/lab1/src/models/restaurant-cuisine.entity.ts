// Ассоциативная таблица M:N — связывает рестораны и кухни
// Один ресторан → несколько кухонь, одна кухня → несколько ресторанов
// Составной первичный ключ: (restaurant_id, cuisine_id)

import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm"
import { Restaurant } from "./restaurant.entity"
import { Cuisine } from "./cuisine.entity"

@Entity("restaurant_cuisines")
export class RestaurantCuisine {
  @PrimaryColumn({ type: "int" })   // часть составного PK + FK → restaurants
  restaurant_id: number

  @PrimaryColumn({ type: "int" })   // часть составного PK + FK → cuisines
  cuisine_id: number

  @ManyToOne(() => Restaurant, restaurant => restaurant.restaurantCuisines)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant

  @ManyToOne(() => Cuisine, cuisine => cuisine.restaurantCuisines)
  @JoinColumn({ name: "cuisine_id" })
  cuisine: Cuisine
}