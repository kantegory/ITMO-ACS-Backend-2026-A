import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn({ name: "review_id" })
  reviewId!: number;

  @Column({ name: "user_id", type: "integer" })
  userId!: number;

  @Column({ name: "user_name", type: "text" })
  userName!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @Column()
  rating!: number;

  @Column({ type: "text" })
  comment!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
