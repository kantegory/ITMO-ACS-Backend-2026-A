import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Cuisine } from './Cuisine';
import { RestaurantPhoto } from './RestaurantPhoto';
import { MenuItem } from './MenuItem';
import { RestaurantTable } from './RestaurantTable';
import { Review } from './Review';

export type PriceLevel = '$' | '$$' | '$$$' | '$$$$';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn({ name: 'restaurant_id' })
  restaurant_id!: number;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 300 })
  address!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 4 })
  price_level!: PriceLevel;

  @Column({ type: 'varchar', length: 5 })
  opening_time!: string;

  @Column({ type: 'varchar', length: 5 })
  closing_time!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToMany(() => Cuisine, (c) => c.restaurants, { cascade: false })
  @JoinTable({
    name: 'restaurant_cuisines',
    joinColumn: { name: 'restaurant_id', referencedColumnName: 'restaurant_id' },
    inverseJoinColumn: { name: 'cuisine_id', referencedColumnName: 'cuisine_id' },
  })
  cuisines!: Cuisine[];

  @OneToMany(() => RestaurantPhoto, (p) => p.restaurant)
  photos!: RestaurantPhoto[];

  @OneToMany(() => MenuItem, (m) => m.restaurant)
  menu_items!: MenuItem[];

  @OneToMany(() => RestaurantTable, (t) => t.restaurant)
  tables!: RestaurantTable[];

  @OneToMany(() => Review, (r) => r.restaurant)
  reviews!: Review[];
}
