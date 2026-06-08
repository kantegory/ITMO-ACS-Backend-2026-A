import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { SavedRecipe } from './saved-recipe.entity';
import { RecipeStep } from './recipe-step.entity';
import { RecipeDishType } from './recipe-dish-type.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';

@Entity('recipes')
export class Recipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    difficulty: string;

    @Column()
    cooking_time_minutes: number;

    @Column({ nullable: true })
    image_url: string;

    @Column({ nullable: true })
    video_url: string;

    @ManyToOne(() => User, (user: User) => user.recipes, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @OneToMany(() => Comment, (comment: Comment) => comment.recipe)
    comments: Comment[];

    @OneToMany(() => Like, (like: Like) => like.recipe)
    likes: Like[];

    @OneToMany(
        () => SavedRecipe,
        (saved_recipe: SavedRecipe) => saved_recipe.recipe,
    )
    saved_recipes: SavedRecipe[];

    @OneToMany(
        () => RecipeStep,
        (recipe_step: RecipeStep) => recipe_step.recipe,
    )
    steps: RecipeStep[];

    @OneToMany(() => RecipeDishType, (rdt: RecipeDishType) => rdt.recipe)
    dish_types: RecipeDishType[];

    @OneToMany(() => RecipeIngredient, (ri: RecipeIngredient) => ri.recipe)
    ingredients: RecipeIngredient[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
