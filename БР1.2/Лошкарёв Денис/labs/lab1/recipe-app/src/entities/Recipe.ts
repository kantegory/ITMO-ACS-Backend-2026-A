import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { RecipeStep } from "./RecipeStep";
import { RecipeIngredient } from "./RecipeIngredient";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { Favorite } from "./Favorite";

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

    @CreateDateColumn()
    created_at!: Date;

    // Связи
    @ManyToOne(() => User, (user) => user.recipes)
    author!: User;

    @OneToMany(() => RecipeStep, (step) => step.recipe)
    steps!: RecipeStep[];

    @OneToMany(() => RecipeIngredient, (ri) => ri.recipe)
    recipe_ingredients!: RecipeIngredient[];

    @OneToMany(() => Comment, (comment) => comment.recipe)
    comments!: Comment[];

    @OneToMany(() => Like, (like) => like.recipe)
    likes!: Like[];

    @OneToMany(() => Favorite, (fav) => fav.recipe)
    favorites!: Favorite[];
}