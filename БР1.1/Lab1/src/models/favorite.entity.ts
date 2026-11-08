import {
    BaseEntity,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { Recipe } from './recipe.entity';
import { User } from './user.entity';

@Entity({ name: 'favorites' })
@Unique(['recipe', 'user'])
export class Favorite extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'favorite_id' })
    id: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.favorites, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @ManyToOne(() => User, (user) => user.favorites, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
