import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Recipe } from "./Recipe";
import { Ingredient } from "./Ingredient";

@Entity("recipe_ingredients")
export class RecipeIngredient {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    amount!: string; 

    @ManyToOne(() => Recipe, (recipe) => recipe.recipe_ingredients)
    recipe!: Recipe;

    @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipe_ingredients)
    ingredient!: Ingredient;
}