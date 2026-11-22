import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';

import { Recipe } from './recipe.entity';
import { User } from './user.entity';

// рецепт можно сохранить только один раз
@Entity()
@Unique(['recipe_id', 'user_id'])
export class SavedRecipe extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    recipe_id: number;

    @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @Column({ type: 'int' })
    user_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @CreateDateColumn()
    created_at: Date;
}
