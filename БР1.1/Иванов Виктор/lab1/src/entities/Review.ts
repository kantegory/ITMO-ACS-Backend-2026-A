import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Restaurant } from "./Restaurant";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @Column()
  restaurant_id: string;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text" })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;
}
