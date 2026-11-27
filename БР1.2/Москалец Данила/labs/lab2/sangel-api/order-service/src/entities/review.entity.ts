import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity({ name: 'reviews' })
@Unique(['service_id', 'user_id'])
export class Review extends BaseEntity {
  @Column({ name: 'service_id' })
  service_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}