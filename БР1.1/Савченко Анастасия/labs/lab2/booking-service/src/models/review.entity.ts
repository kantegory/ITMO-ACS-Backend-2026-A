import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

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
}