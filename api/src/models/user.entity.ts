import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';

import { Recipe } from './recipe.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { SavedRecipe } from './saved-recipe.entity';
import { Follow } from './follow.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    username: string;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    firstName: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    lastName: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => Recipe, (recipe) => recipe.author)
    recipes: Recipe[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

    @OneToMany(() => Like, (like) => like.user)
    likes: Like[];

    @OneToMany(() => SavedRecipe, (savedRecipe) => savedRecipe.user)
    savedRecipes: SavedRecipe[];

    @OneToMany(() => Follow, (follow) => follow.follower)
    following: Follow[];

    @OneToMany(() => Follow, (follow) => follow.following)
    followers: Follow[];
}
