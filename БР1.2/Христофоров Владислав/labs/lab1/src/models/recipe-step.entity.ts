import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity('recipe_steps')
export class RecipeStep {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    step_number: number;

    @Column({ type: 'text' })
    instruction: string;

    @Column({ nullable: true })
    image_url: string;

    @ManyToOne(() => Recipe, (recipe: Recipe) => recipe.steps, {
        nullable: false,
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;
}
