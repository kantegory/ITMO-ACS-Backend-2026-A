import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './Restaurant';

@Entity('restaurant_photos')
export class RestaurantPhoto {
  @PrimaryGeneratedColumn({ name: 'photo_id' })
  photo_id!: number;

  @Column({ type: 'integer' })
  restaurant_id!: number;

  @Column({ type: 'varchar', length: 500 })
  photo_url!: string;

  @Column({ type: 'boolean', default: false })
  is_main!: boolean;

  @ManyToOne(() => Restaurant, (r) => r.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;
}
