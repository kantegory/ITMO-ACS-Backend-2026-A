import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Recipe } from "./Recipe";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { SavedRecipe } from "./SavedRecipe";
import { Subscription } from "./Subscription";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    avatar_url: string;

    @Column({ nullable: true })
    bio: string;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Recipe, recipe => recipe.author)
    recipes: Recipe[];

    @OneToMany(() => Comment, comment => comment.user)
    comments: Comment[];

    @OneToMany(() => Like, like => like.user)
    likes: Like[];

    @OneToMany(() => SavedRecipe, saved => saved.user)
    savedRecipes: SavedRecipe[];

    @OneToMany(() => Subscription, sub => sub.subscriber)
    subscriptions: Subscription[];
}