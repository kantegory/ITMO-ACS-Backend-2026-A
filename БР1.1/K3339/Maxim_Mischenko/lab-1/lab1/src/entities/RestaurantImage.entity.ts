import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { IsBoolean, IsString, IsUrl } from 'class-validator';
import { Restaurant } from './Restaurant.entity';

@Entity('restaurant_images')
export class RestaurantImage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ name: 'image_url' })
  @IsString()
  @IsUrl()
  imageUrl: string;

  @Column({ name: 'is_main', default: false })
  @IsBoolean()
  isMain: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  toResponse(): ImageResponse {
    return {
      id: this.id,
      image_url: this.imageUrl,
      is_main: this.isMain,
    };
  }
}

export interface ImageResponse {
  id: number;
  image_url: string;
  is_main: boolean;
}
