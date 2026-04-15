import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { IsInt, IsString, IsEnum, Min, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { Restaurant } from './Restaurant.entity';
import { Table } from './Table.entity';
import { User } from './User.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: Table;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'booking_date', type: 'date' })
  @IsDateString()
  bookingDate: string; // Format: YYYY-MM-DD

  @Column({ name: 'start_time' })
  @IsString()
  startTime: string; // Format: HH:MM

  @Column({ name: 'end_time' })
  @IsString()
  endTime: string; // Format: HH:MM

  @Column({ name: 'guests_count' })
  @IsInt()
  @Min(1)
  guestsCount: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  toResponse(): BookingResponse {
    return {
      id: this.id,
      restaurant: {
        id: this.restaurant?.id,
        name: this.restaurant?.name,
        city: this.restaurant?.city,
        address: this.restaurant?.address,
      },
      table: this.table?.toResponse(),
      user: this.user?.toResponse(),
      booking_date: this.bookingDate,
      start_time: this.startTime,
      end_time: this.endTime,
      guests_count: this.guestsCount,
      comment: this.comment || null,
      status: this.status,
      created_at: this.createdAt,
    };
  }
}

export interface BookingResponse {
  id: number;
  restaurant: {
    id: number;
    name: string;
    city: string;
    address: string;
  };
  table: any;
  user: any;
  booking_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  comment: string | null;
  status: BookingStatus;
  created_at: Date;
}
