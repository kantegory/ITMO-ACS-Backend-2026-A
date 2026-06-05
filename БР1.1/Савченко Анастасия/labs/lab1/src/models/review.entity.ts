import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./user.entity"
import { Restaurant } from "./restaurant.entity"

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn()
  review_id: number

  @Column({ type: "int" })
  user_id: number

  @Column({ type: "int" })
  restaurant_id: number

  @Column({ type: "int" })
  score: number

  @Column({ type: "text", nullable: true })
  comment: string

  @CreateDateColumn()
  created_at: Date

  @Column({ type: "timestamp", nullable: true })
  edited_at: Date

  @ManyToOne(() => User, user => user.reviews)
  @JoinColumn({ name: "user_id" })
  user: User

  @ManyToOne(() => Restaurant, restaurant => restaurant.reviews)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant
}