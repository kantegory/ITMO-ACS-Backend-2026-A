import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BaseEntity
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

export enum MenuCategory {
  APPETIZER = 'appetizer',
  SOUP = 'soup',
  MAIN = 'main',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage'
}

@Entity('menu_items')
export class MenuItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  restaurant_id: string;

  @ManyToOne(() => Restaurant, (r) => r.menu_items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: false })
  price: number;

  @Column({ type: 'enum', enum: MenuCategory, default: MenuCategory.MAIN })
  category: MenuCategory;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;
}
