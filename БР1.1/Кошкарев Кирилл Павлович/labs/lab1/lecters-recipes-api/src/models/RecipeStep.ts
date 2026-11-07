import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Recipe } from './Recipe';

/** Шаг пошаговой инструкции приготовления. */
@Entity('recipe_steps')
@Unique('uq_recipe_step', ['recipeId', 'stepNumber'])
export class RecipeStep {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'bigint' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @Column({ type: 'int' })
  stepNumber: number;

  @Column({ type: 'text' })
  instruction: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'int', nullable: true })
  durationMinutes: number | null;
}
