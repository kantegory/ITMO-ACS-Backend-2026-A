import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_steps' })
@Unique(['recipe', 'stepNumber'])
export class RecipeStep extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'step_id' })
    id: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.steps, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @Column({ name: 'step_number', type: 'int' })
    stepNumber: number;

    @Column({ type: 'text' })
    description: string;
}
