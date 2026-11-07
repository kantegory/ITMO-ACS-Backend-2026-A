import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne,
  OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { RecipeDifficulty, RecipeStatus } from './enums';
import { User } from './User';
import { Category } from './Category';
import { Cuisine } from './Cuisine';
import { Tag } from './Tag';
import { RecipeIngredient } from './RecipeIngredient';
import { RecipeStep } from './RecipeStep';
import { RecipeMedia } from './RecipeMedia';
import { Comment } from './Comment';
import { Like } from './Like';
import { Favorite } from './Favorite';

/** Рецепт — основная публикация кулинарного блога. */
@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'bigint' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.recipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, (category) => category.recipes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Index()
  @Column({ type: 'bigint', nullable: true })
  cuisineId: string | null;

  @ManyToOne(() => Cuisine, (cuisine) => cuisine.recipes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cuisineId' })
  cuisine: Cuisine | null;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 180 })
  slug: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'enum', enum: RecipeDifficulty, default: RecipeDifficulty.EASY })
  difficulty: RecipeDifficulty;

  @Column({ type: 'int', default: 0 })
  prepTimeMinutes: number;

  @Index()
  @Column({ type: 'int', default: 0 })
  cookTimeMinutes: number;

  @Column({ type: 'int', default: 1 })
  servings: number;

  @Column({ type: 'int', nullable: true })
  calories: number | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  videoUrl: string | null;

  @Index()
  @Column({ type: 'enum', enum: RecipeStatus, default: RecipeStatus.DRAFT })
  status: RecipeStatus;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => Tag, (tag) => tag.recipes, { cascade: false })
  @JoinTable({
    name: 'recipe_tags',
    joinColumn: { name: 'recipeId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => RecipeIngredient, (ri) => ri.recipe, { cascade: true })
  ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeStep, (step) => step.recipe, { cascade: true })
  steps: RecipeStep[];

  @OneToMany(() => RecipeMedia, (media) => media.recipe, { cascade: true })
  media: RecipeMedia[];

  @OneToMany(() => Comment, (comment) => comment.recipe)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.recipe)
  likes: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.recipe)
  favorites: Favorite[];
}
