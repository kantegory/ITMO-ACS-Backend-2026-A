// Ресторан — основная сущность, к нему привязаны столики, меню, фото, брони, отзывы
// Связь с кухнями через ассоциативную таблицу RestaurantCuisine (M:N)

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { RestaurantCuisine } from "./restaurant-cuisine.entity"
import { Table } from "./table.entity"
import { MenuItem } from "./menu-item.entity"
import { RestaurantPhoto } from "./restaurant-photo.entity"
import { Booking } from "./booking.entity"
import { Review } from "./review.entity"

@Entity("restaurants")
export class Restaurant {
  @PrimaryGeneratedColumn()
  restaurant_id: number

  @Column({ type: "varchar" })
  name: string

  @Column({ type: "text", nullable: true })
  info: string

  @Column({ type: "varchar" })
  city_name: string

  @Column({ type: "varchar" })
  street_address: string

  @Column({ type: "varchar" })
  price_tier: string

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => RestaurantCuisine, rc => rc.restaurant)
  restaurantCuisines: RestaurantCuisine[]

  @OneToMany(() => Table, table => table.restaurant)
  tables: Table[]

  @OneToMany(() => MenuItem, item => item.restaurant)
  menuItems: MenuItem[]

  @OneToMany(() => RestaurantPhoto, photo => photo.restaurant)
  photos: RestaurantPhoto[]

  @OneToMany(() => Booking, booking => booking.restaurant)
  bookings: Booking[]

  @OneToMany(() => Review, review => review.restaurant)
  reviews: Review[]
}