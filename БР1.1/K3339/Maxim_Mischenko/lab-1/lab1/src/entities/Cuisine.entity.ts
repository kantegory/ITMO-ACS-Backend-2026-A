import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { IsString, MaxLength } from 'class-validator';
import { Restaurant } from './Restaurant.entity';

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsString()
  @MaxLength(50)
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.cuisine)
  restaurants: Restaurant[];

  toResponse(): CuisineResponse {
    return {
      id: this.id,
      name: this.name,
    };
  }
}

export interface CuisineResponse {
  id: number;
  name: string;
}
