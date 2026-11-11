import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('reviews')
@Unique('uq_review_user_restaurant', ['user_id', 'restaurant_id'])
export class Review {
  @PrimaryGeneratedColumn({ name: 'review_id' })
  review_id!: number;

  // ссылки на сущности других сервисов — без FK (database-per-service)
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
}
