import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Comment } from './comment.entity';
import { Favorite } from './favorite.entity';
import { RecipeLike } from './recipe-like.entity';
import { Recipe } from './recipe.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'user_id' })
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    username: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash: string;

    @Column({ type: 'text', nullable: true })
    bio: string | null;

    @Column({ name: 'avatar_url', type: 'varchar', length: 1024, nullable: true })
    avatarUrl: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @OneToMany(() => Recipe, (recipe) => recipe.author)
    recipes: Recipe[];

    @OneToMany(() => Comment, (comment) => comment.author)
    comments: Comment[];

    @OneToMany(() => RecipeLike, (recipeLike) => recipeLike.user)
    likes: RecipeLike[];

    @OneToMany(() => Favorite, (favorite) => favorite.user)
    favorites: Favorite[];
}
