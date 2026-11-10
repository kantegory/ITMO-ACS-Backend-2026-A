import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './Restaurant';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn({ name: 'menu_item_id' })
  menu_item_id!: number;

  @Column({ type: 'integer' })
  restaurant_id!: number;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @ManyToOne(() => Restaurant, (r) => r.menu_items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;
}
