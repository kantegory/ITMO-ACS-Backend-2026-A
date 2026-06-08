import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity("favorites")
export class Favorite {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.favorites)
    user!: User;

    @ManyToOne(() => Recipe, (recipe) => recipe.favorites)
    recipe!: Recipe;
}