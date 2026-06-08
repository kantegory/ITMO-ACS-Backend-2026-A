import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity("likes")
export class Like {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.likes)
    user!: User;

    @ManyToOne(() => Recipe, (recipe) => recipe.likes)
    recipe!: Recipe;
}