import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./Restaurant";
import { User } from "./User";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn({ name: "review_id", type: "integer" })
  reviewId!: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @Column({ type: "integer" })
  rating!: number;

  @Column({ type: "text" })
  comment!: string;

  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt!: Date;
}
