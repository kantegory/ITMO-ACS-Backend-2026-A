import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity({ name: 'user_favorites' })
@Unique(['service_id', 'user_id'])
export class Favorite extends BaseEntity {
  @Column({ name: 'service_id' })
  service_id: number;

  @Column({ name: 'user_id' })
  user_id: number;
}