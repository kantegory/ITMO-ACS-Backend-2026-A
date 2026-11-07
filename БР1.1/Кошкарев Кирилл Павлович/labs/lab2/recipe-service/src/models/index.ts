import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne,
  OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm';

export enum RecipeStatus { DRAFT = 'draft', PUBLISHED = 'published', ARCHIVED = 'archived' }
export enum RecipeDifficulty { EASY = 'easy', MEDIUM = 'medium', HARD = 'hard' }
export enum MediaType { PHOTO = 'photo', VIDEO = 'video' }

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 64 }) name: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 64 }) slug: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @OneToMany(() => Recipe, (recipe) => recipe.category) recipes: Recipe[];
}

@Entity('cuisines')
export class Cuisine {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 64 }) name: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 64 }) slug: string;
  @OneToMany(() => Recipe, (recipe) => recipe.cuisine) recipes: Recipe[];
}

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 48 }) name: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 48 }) slug: string;
  @ManyToMany(() => Recipe, (recipe) => recipe.tags) recipes: Recipe[];
}

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 128 }) name: string;
  @Column({ type: 'varchar', length: 32, default: 'г' }) defaultUnit: string;
  @Column({ type: 'numeric', precision: 7, scale: 2, nullable: true }) kcalPer100: string | null;
  @OneToMany(() => RecipeIngredient, (ri) => ri.ingredient) recipeIngredients: RecipeIngredient[];
}

/**
 * Рецепт. authorId — «мягкая» ссылка на пользователя из другой базы:
 * внешнего ключа нет, целостность поддерживается событиями и внутренним API.
 */
@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;

  @Index() @Column({ type: 'bigint' }) authorId: string;

  @Index() @Column({ type: 'bigint', nullable: true }) categoryId: string | null;
  @ManyToOne(() => Category, (category) => category.recipes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' }) category: Category | null;

  @Index() @Column({ type: 'bigint', nullable: true }) cuisineId: string | null;
  @ManyToOne(() => Cuisine, (cuisine) => cuisine.recipes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cuisineId' }) cuisine: Cuisine | null;

  @Column({ type: 'varchar', length: 160 }) title: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 180 }) slug: string;
  @Column({ type: 'varchar', length: 512, nullable: true }) summary: string | null;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Index() @Column({ type: 'enum', enum: RecipeDifficulty, default: RecipeDifficulty.EASY }) difficulty: RecipeDifficulty;
  @Column({ type: 'int', default: 0 }) prepTimeMinutes: number;
  @Index() @Column({ type: 'int', default: 0 }) cookTimeMinutes: number;
  @Column({ type: 'int', default: 1 }) servings: number;
  @Column({ type: 'int', nullable: true }) calories: number | null;
  @Column({ type: 'varchar', length: 512, nullable: true }) coverImageUrl: string | null;
  @Column({ type: 'varchar', length: 512, nullable: true }) videoUrl: string | null;
  @Index() @Column({ type: 'enum', enum: RecipeStatus, default: RecipeStatus.DRAFT }) status: RecipeStatus;

  // денормализованные счётчики, обновляются событиями social-service
  @Column({ type: 'int', default: 0 }) likesCount: number;
  @Column({ type: 'int', default: 0 }) commentsCount: number;

  @Column({ type: 'timestamptz', nullable: true }) publishedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;

  @ManyToMany(() => Tag, (tag) => tag.recipes)
  @JoinTable({
    name: 'recipe_tags',
    joinColumn: { name: 'recipeId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => RecipeIngredient, (ri) => ri.recipe, { cascade: true }) ingredients: RecipeIngredient[];
  @OneToMany(() => RecipeStep, (step) => step.recipe, { cascade: true }) steps: RecipeStep[];
  @OneToMany(() => RecipeMedia, (media) => media.recipe, { cascade: true }) media: RecipeMedia[];
}

@Entity('recipe_ingredients')
@Unique('uq_recipe_ingredient', ['recipeId', 'ingredientId'])
export class RecipeIngredient {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index() @Column({ type: 'bigint' }) recipeId: string;
  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' }) recipe: Recipe;
  @Index() @Column({ type: 'bigint' }) ingredientId: string;
  @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeIngredients, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'ingredientId' }) ingredient: Ingredient;
  @Column({ type: 'numeric', precision: 9, scale: 2 }) quantity: string;
  @Column({ type: 'varchar', length: 32, default: 'г' }) unit: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) note: string | null;
  @Column({ type: 'int', default: 0 }) position: number;
}

@Entity('recipe_steps')
@Unique('uq_recipe_step', ['recipeId', 'stepNumber'])
export class RecipeStep {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index() @Column({ type: 'bigint' }) recipeId: string;
  @ManyToOne(() => Recipe, (recipe) => recipe.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' }) recipe: Recipe;
  @Column({ type: 'int' }) stepNumber: number;
  @Column({ type: 'text' }) instruction: string;
  @Column({ type: 'varchar', length: 512, nullable: true }) imageUrl: string | null;
  @Column({ type: 'int', nullable: true }) durationMinutes: number | null;
}

@Entity('recipe_media')
export class RecipeMedia {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Index() @Column({ type: 'bigint' }) recipeId: string;
  @ManyToOne(() => Recipe, (recipe) => recipe.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' }) recipe: Recipe;
  @Column({ type: 'varchar', length: 512 }) url: string;
  @Column({ type: 'enum', enum: MediaType, default: MediaType.PHOTO }) type: MediaType;
  @Column({ type: 'varchar', length: 160, nullable: true }) caption: string | null;
  @Column({ type: 'int', default: 0 }) position: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

/** Журнал обработанных событий — защита от повторной доставки (at-least-once). */
@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryColumn({ type: 'uuid' }) eventId: string;
  @Column({ type: 'varchar', length: 64 }) type: string;
  @CreateDateColumn({ type: 'timestamptz' }) processedAt: Date;
}
