import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { DifficultyLevel } from './difficulty-level.entity';
import { RecipeCategory } from './recipe-category.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { RecipeMedia } from './recipe-media.entity';
import { RecipeStep } from './recipe-step.entity';

@Entity({ name: 'recipes' })
@Index(['authorId'])
@Index(['category'])
@Index(['difficulty'])
@Index(['createdAt'])
export class Recipe extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'recipe_id' })
    id: number;

    @Column({ name: 'author_id', type: 'int' })
    authorId: number;

    @ManyToOne(() => RecipeCategory, (category) => category.recipes, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'category_id' })
    category: RecipeCategory;

    @ManyToOne(() => DifficultyLevel, (difficulty) => difficulty.recipes, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'difficulty_id' })
    difficulty: DifficultyLevel;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'cooking_time_minutes', type: 'int' })
    cookingTimeMinutes: number;

    @Column({ type: 'int' })
    servings: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.recipe)
    ingredients: RecipeIngredient[];

    @OneToMany(() => RecipeStep, (recipeStep) => recipeStep.recipe)
    steps: RecipeStep[];

    @OneToMany(() => RecipeMedia, (recipeMedia) => recipeMedia.recipe)
    media: RecipeMedia[];
}
