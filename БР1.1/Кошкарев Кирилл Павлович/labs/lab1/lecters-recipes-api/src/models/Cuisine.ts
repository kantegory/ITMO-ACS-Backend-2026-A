import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Recipe } from './Recipe';

/** Кухня мира: итальянская, японская, грузинская и т.д. */
@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  slug: string;

  @OneToMany(() => Recipe, (recipe) => recipe.cuisine)
  recipes: Recipe[];
}
