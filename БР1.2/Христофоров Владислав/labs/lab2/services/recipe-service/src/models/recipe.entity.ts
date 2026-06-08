import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from "typeorm";
import { SavedRecipe } from "./saved-recipe.entity";
import { RecipeStep } from "./recipe-step.entity";
import { RecipeDishType } from "./recipe-dish-type.entity";
import { RecipeIngredient } from "./recipe-ingredient.entity";

@Entity("recipes")
export class Recipe {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column()
    difficulty: string;

    @Column()
    cooking_time_minutes: number;

    @Column({ nullable: true })
    image_url: string;

    @Column({ nullable: true })
    video_url: string;

    @Column({ type: "uuid" })
    author_id: string;

    @OneToMany(() => SavedRecipe, (saved_recipe) => saved_recipe.recipe)
    saved_recipes: SavedRecipe[];

    @OneToMany(() => RecipeStep, (step) => step.recipe)
    steps: RecipeStep[];

    @OneToMany(() => RecipeDishType, (rdt) => rdt.recipe)
    dish_types: RecipeDishType[];

    @OneToMany(() => RecipeIngredient, (ri) => ri.recipe)
    ingredients: RecipeIngredient[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
