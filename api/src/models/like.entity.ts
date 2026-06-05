import {
    Entity,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    Unique,
} from 'typeorm';

import { User } from './user.entity';
import { Recipe } from './recipe.entity';

@Entity()
@Unique(['user', 'recipe'])
export class Like extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.likes, { nullable: false })
    user: User;

    @ManyToOne(() => Recipe, (recipe) => recipe.likes, { nullable: false })
    recipe: Recipe;
}
