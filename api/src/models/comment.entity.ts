import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';

import { User } from './user.entity';
import { Recipe } from './recipe.entity';

@Entity()
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', nullable: false })
    text: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.comments, { nullable: false })
    user: User;

    @ManyToOne(() => Recipe, (recipe) => recipe.comments, { nullable: false })
    recipe: Recipe;
}
