import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { IsString, IsNumber, Min, MaxLength, IsOptional } from 'class-validator';
import { Restaurant } from './Restaurant.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  @IsString()
  @MaxLength(150)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  price: number;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  toResponse(): MenuItemResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description || null,
      price: this.price,
      category: this.category || null,
    };
  }
}

export interface MenuItemResponse {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
}
