import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Unique, Column } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity()
@Unique(["user_id", "recipe_id"])
export class Like {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.likes)
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Recipe, recipe => recipe.likes)
    recipe: Recipe;

    @Column()
    recipe_id: number;

    @CreateDateColumn()
    created_at: Date;
}