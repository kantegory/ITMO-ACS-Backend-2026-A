import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { Ingredient } from './ingredient.entity';

@Entity('recipe_ingredients')
export class RecipeIngredient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: ['g', 'ml', 'pcs', 'tbsp', 'tsp'] })
    unit: string;

    @ManyToOne(() => Recipe, (recipe: Recipe) => recipe.ingredients, {
        nullable: false,
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @ManyToOne(
        () => Ingredient,
        (ingredient: Ingredient) => ingredient.recipe_ingredients,
        { nullable: false },
    )
    @JoinColumn({ name: 'ingredient_id' })
    ingredient: Ingredient;
}
