import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { RecipeStep } from "./RecipeStep";
import { RecipeIngredient } from "./RecipeIngredient";

@Entity("recipes")
export class Recipe {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ nullable: true })
    dish_type?: string;

    @Column({ default: "medium" })
    difficulty!: string;

    @Column({ nullable: true })
    video_url?: string;

    @Column()
    authorId!: number; 

    @CreateDateColumn()
    created_at!: Date;

    @OneToMany(() => RecipeStep, (step) => step.recipe)
    steps!: RecipeStep[];

    @OneToMany(() => RecipeIngredient, (ri) => ri.recipe)
    recipe_ingredients!: RecipeIngredient[];
}