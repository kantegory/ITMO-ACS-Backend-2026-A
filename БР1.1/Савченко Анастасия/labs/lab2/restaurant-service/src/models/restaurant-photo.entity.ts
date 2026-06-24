import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { Restaurant } from "./restaurant.entity"

@Entity("restaurant_photos")
export class RestaurantPhoto {
  @PrimaryGeneratedColumn()
  photo_id: number

  @Column({ type: "int" })
  restaurant_id: number

  @Column({ type: "varchar" })
  photo_url: string

  @Column({ type: "int", default: 0 })
  display_order: number

  @Column({ type: "varchar", nullable: true })
  alt_text: string

  @ManyToOne(() => Restaurant, restaurant => restaurant.photos)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant
}