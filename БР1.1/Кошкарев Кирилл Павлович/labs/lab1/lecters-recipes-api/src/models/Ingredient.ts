import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RecipeIngredient } from './RecipeIngredient';

/** Справочник ингредиентов — основа фильтрации рецептов по составу. */
@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 32, default: 'г' })
  defaultUnit: string;

  @Column({ type: 'numeric', precision: 7, scale: 2, nullable: true })
  kcalPer100: string | null;

  @OneToMany(() => RecipeIngredient, (ri) => ri.ingredient)
  recipeIngredients: RecipeIngredient[];
}
