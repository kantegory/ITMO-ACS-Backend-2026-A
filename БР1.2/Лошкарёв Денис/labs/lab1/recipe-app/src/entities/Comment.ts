import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity("comments")
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "text" })
    content!: string;

    @CreateDateColumn()
    created_at!: Date;

    @ManyToOne(() => User, (user) => user.comments)
    user!: User;

    @ManyToOne(() => Recipe, (recipe) => recipe.comments)
    recipe!: Recipe;
}