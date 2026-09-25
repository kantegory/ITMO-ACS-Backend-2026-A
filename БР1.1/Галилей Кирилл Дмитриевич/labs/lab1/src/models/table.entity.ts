import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BaseEntity
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Reservation } from './reservation.entity';

export enum TableZone {
  MAIN_HALL = 'main_hall',
  TERRACE = 'terrace',
  VIP = 'vip',
  WINDOW = 'window'
}

@Entity('restaurant_tables')
export class RestaurantTable extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  restaurant_id: string;

  @ManyToOne(() => Restaurant, (r) => r.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ type: 'int', nullable: false })
  table_number: number;

  @Column({ type: 'int', nullable: false, default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: TableZone, default: TableZone.MAIN_HALL })
  location_zone: TableZone;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Reservation, (res) => res.table)
  reservations: Reservation[];
}
