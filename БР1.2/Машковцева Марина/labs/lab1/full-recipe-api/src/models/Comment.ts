import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    text: string;

    @ManyToOne(() => User, user => user.comments)
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Recipe, recipe => recipe.comments)
    recipe: Recipe;

    @Column()
    recipe_id: number;

    @CreateDateColumn()
    created_at: Date;
}