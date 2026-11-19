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
export class SavedRecipe extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.savedRecipes, { nullable: false })
    user: User;

    @ManyToOne(() => Recipe, (recipe) => recipe.savedRecipes, { nullable: false })
    recipe: Recipe;
}
