import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Recipe } from "./Recipe";

@Entity()
export class Step {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Recipe, recipe => recipe.steps)
    recipe: Recipe;

    @Column()
    recipe_id: number;

    @Column()
    step_number: number;

    @Column("text")
    instruction: string;
}