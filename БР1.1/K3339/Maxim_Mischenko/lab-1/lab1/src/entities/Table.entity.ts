import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { IsInt, IsString, Min, MaxLength, IsOptional } from 'class-validator';
import { Restaurant } from './Restaurant.entity';
import { Booking } from './Booking.entity';

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  @IsInt()
  @Min(1)
  capacity: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Booking, (booking) => booking.table)
  bookings: Booking[];

  toResponse(): TableResponse {
    return {
      id: this.id,
      restaurant_id: this.restaurant?.id,
      capacity: this.capacity,
      label: this.label || null,
    };
  }
}

export interface TableResponse {
  id: number;
  restaurant_id: number;
  capacity: number;
  label: string | null;
}
