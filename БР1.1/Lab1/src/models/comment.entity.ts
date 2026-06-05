import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Recipe } from './recipe.entity';
import { User } from './user.entity';

@Entity({ name: 'comments' })
@Index(['recipe'])
@Index(['author'])
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'comment_id' })
    id: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.comments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @ManyToOne(() => User, (user) => user.comments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    author: User;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
