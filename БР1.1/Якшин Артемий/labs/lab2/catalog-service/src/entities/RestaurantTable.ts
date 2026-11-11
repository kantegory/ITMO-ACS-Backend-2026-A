import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './Restaurant';

export type TableStatus = 'available' | 'reserved';

@Entity('restaurant_tables')
export class RestaurantTable {
  @PrimaryGeneratedColumn({ name: 'table_id' })
  table_id!: number;

  @Column({ type: 'integer' })
  restaurant_id!: number;

  @Column({ type: 'integer' })
  table_number!: number;

  @Column({ type: 'integer' })
  capacity!: number;

  @Column({ type: 'varchar', length: 20, default: 'available' })
  status!: TableStatus;

  @ManyToOne(() => Restaurant, (r) => r.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;
}
