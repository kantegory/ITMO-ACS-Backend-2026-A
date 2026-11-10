import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Restaurant } from './Restaurant';

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn({ name: 'cuisine_id' })
  cuisine_id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @ManyToMany(() => Restaurant, (r) => r.cuisines)
  restaurants!: Restaurant[];
}
