import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Restaurant } from './Restaurant';

@Entity('reviews')
@Unique('uq_review_user_restaurant', ['user_id', 'restaurant_id'])
export class Review {
  @PrimaryGeneratedColumn({ name: 'review_id' })
  review_id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'integer' })
  restaurant_id!: number;

  @Column({ type: 'integer' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => User, (u) => u.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Restaurant, (r) => r.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;
}
