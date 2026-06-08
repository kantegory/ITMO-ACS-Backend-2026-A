import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RecipeIngredient } from "./recipe-ingredient.entity";

@Entity("ingredients")
export class Ingredient {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(
        () => RecipeIngredient,
        (recipeIngredient: RecipeIngredient) => recipeIngredient.ingredient,
    )
    recipe_ingredients: RecipeIngredient[];
}
