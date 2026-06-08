import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Recipe } from './recipe.entity';

@Entity('saved_recipes')
export class SavedRecipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user: User) => user.saved_recipes, {
        nullable: false,
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Recipe, (recipe: Recipe) => recipe.saved_recipes, {
        nullable: false,
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @CreateDateColumn()
    created_at: Date;
}
