import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
} from 'typeorm';

import { User } from './user.entity';
import { Ingredient } from './ingredient.entity';
import { DishType } from './dish-type.entity';
import { RecipeStep } from './recipe-step.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { SavedRecipe } from './saved-recipe.entity';

export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

@Entity()
export class Recipe extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: Difficulty,
        default: Difficulty.EASY,
    })
    difficulty: Difficulty;

    @Column({ type: 'int', nullable: true })
    cookingTime: number;

    @Column({ type: 'int', nullable: true })
    servings: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    photoUrl: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    videoUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.recipes, { nullable: false })
    author: User;

    @ManyToMany(() => Ingredient, (ingredient) => ingredient.recipes)
    @JoinTable()
    ingredients: Ingredient[];

    @ManyToMany(() => DishType, (dishType) => dishType.recipes)
    @JoinTable()
    dishTypes: DishType[];

    @OneToMany(() => RecipeStep, (step) => step.recipe)
    steps: RecipeStep[];

    @OneToMany(() => Comment, (comment) => comment.recipe)
    comments: Comment[];

    @OneToMany(() => Like, (like) => like.recipe)
    likes: Like[];

    @OneToMany(() => SavedRecipe, (savedRecipe) => savedRecipe.recipe)
    savedRecipes: SavedRecipe[];
}
