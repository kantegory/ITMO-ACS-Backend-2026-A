import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Recipe } from "./Recipe";

@Entity("recipe_steps")
export class RecipeStep {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    step_number!: number;

    @Column({ type: "text" })
    instruction!: string;

    @Column({ nullable: true })
    image_url?: string;

    @ManyToOne(() => Recipe, (recipe) => recipe.steps)
    recipe!: Recipe;
}