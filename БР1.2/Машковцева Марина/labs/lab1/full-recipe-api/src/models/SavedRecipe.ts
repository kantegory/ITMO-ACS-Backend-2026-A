import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Unique, Column } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity()
@Unique(["user_id", "recipe_id"])
export class SavedRecipe {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.savedRecipes)
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Recipe, recipe => recipe.savedBy)
    recipe: Recipe;

    @Column()
    recipe_id: number;

    @CreateDateColumn()
    saved_at: Date;
}