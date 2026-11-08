import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { Ingredient } from './ingredient.entity';
import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_ingredients' })
@Unique(['recipe', 'ingredient'])
export class RecipeIngredient extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'recipe_ingredient_id' })
    id: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeIngredients, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'ingredient_id' })
    ingredient: Ingredient;

    @Column({ type: 'numeric', precision: 10, scale: 2 })
    quantity: string;

    @Column({ type: 'varchar', length: 32 })
    unit: string;
}
