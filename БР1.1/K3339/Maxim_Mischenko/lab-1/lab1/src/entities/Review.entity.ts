import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { IsInt, IsString, Min, Max, MaxLength, IsOptional } from 'class-validator';
import { Restaurant } from './Restaurant.entity';
import { User } from './User.entity';
import { Booking } from './Booking.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Booking, (booking) => booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  toResponse(): ReviewResponse {
    return {
      id: this.id,
      user: {
        id: this.user?.id,
        full_name: this.user?.fullName,
      },
      rating: this.rating,
      comment: this.comment || null,
      created_at: this.createdAt,
    };
  }
}

export interface ReviewResponse {
  id: number;
  user: {
    id: number;
    full_name: string;
  };
  rating: number;
  comment: string | null;
  created_at: Date;
}
