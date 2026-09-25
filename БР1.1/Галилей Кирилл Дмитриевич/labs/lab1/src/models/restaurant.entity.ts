import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity
} from 'typeorm';
import { User } from './user.entity';
import { RestaurantTable } from './table.entity';
import { MenuItem } from './menu-item.entity';
import { Reservation } from './reservation.entity';
import { Review } from './review.entity';

@Entity('restaurants')
export class Restaurant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  cuisine_type: string;

  @Column({ type: 'int', default: 2 })
  price_range: number;

  @Column({ type: 'varchar', length: 500, nullable: false })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 32, nullable: false })
  phone: string;

  @Column({ type: 'time', nullable: false, default: '10:00:00' })
  opening_time: string;

  @Column({ type: 'time', nullable: false, default: '23:00:00' })
  closing_time: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  photo_url: string;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ type: 'uuid', nullable: true })
  manager_id: string;

  @ManyToOne(() => User, (u) => u.managed_restaurants, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => RestaurantTable, (t) => t.restaurant)
  tables: RestaurantTable[];

  @OneToMany(() => MenuItem, (m) => m.restaurant)
  menu_items: MenuItem[];

  @OneToMany(() => Reservation, (r) => r.restaurant)
  reservations: Reservation[];

  @OneToMany(() => Review, (rev) => rev.restaurant)
  reviews: Review[];
}
