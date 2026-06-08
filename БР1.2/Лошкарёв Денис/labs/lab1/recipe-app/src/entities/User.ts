import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Recipe } from "./Recipe";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { Favorite } from "./Favorite";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password_hash!: string;

    @Column({ type: "text", nullable: true })
    bio?: string;

    @Column({ nullable: true })
    avatar_url?: string;

    @CreateDateColumn()
    created_at!: Date;

    // Связи
    @OneToMany(() => Recipe, (recipe) => recipe.author)
    recipes!: Recipe[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments!: Comment[];

    @OneToMany(() => Like, (like) => like.user)
    likes!: Like[];

    @OneToMany(() => Favorite, (fav) => fav.user)
    favorites!: Favorite[];

    // Подписки (Self-referential Many-to-Many)
    @ManyToMany(() => User, (user) => user.following)
    @JoinTable({
        name: "follows",
        joinColumn: { name: "follower_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "following_id", referencedColumnName: "id" }
    })
    following!: User[];

    @ManyToMany(() => User, (user) => user.followers)
    followers!: User[];
}