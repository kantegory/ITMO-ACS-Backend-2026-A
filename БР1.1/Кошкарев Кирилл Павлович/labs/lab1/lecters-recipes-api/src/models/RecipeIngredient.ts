import {
  Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Recipe } from './Recipe';
import { Ingredient } from './Ingredient';

/** Позиция состава рецепта: связь «рецепт — ингредиент» с количеством. */
@Entity('recipe_ingredients')
@Unique('uq_recipe_ingredient', ['recipeId', 'ingredientId'])
export class RecipeIngredient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'bigint' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @Index()
  @Column({ type: 'bigint' })
  ingredientId: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeIngredients, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Ingredient;

  @Column({ type: 'numeric', precision: 9, scale: 2 })
  quantity: string;

  @Column({ type: 'varchar', length: 32, default: 'г' })
  unit: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  note: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;
}
