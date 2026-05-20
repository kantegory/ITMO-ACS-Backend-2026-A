import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { Booking } from "./booking.entity"
import { Review } from "./review.entity"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  user_id: number

  @Column({ type: "varchar", unique: true })
  email: string

  @Column({ type: "varchar" })
  password: string

  @Column({ type: "varchar" })
  name: string

  @Column({ type: "varchar", nullable: true })
  phone_num: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToMany(() => Booking, booking => booking.user)
  bookings: Booking[]

  @OneToMany(() => Review, review => review.user)
  reviews: Review[]
}