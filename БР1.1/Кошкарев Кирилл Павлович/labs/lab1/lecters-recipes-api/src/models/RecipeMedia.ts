import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { MediaType } from './enums';
import { Recipe } from './Recipe';

/** Элемент фото/видео-галереи рецепта. */
@Entity('recipe_media')
export class RecipeMedia {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index()
  @Column({ type: 'bigint' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @Column({ type: 'varchar', length: 512 })
  url: string;

  @Column({ type: 'enum', enum: MediaType, default: MediaType.PHOTO })
  type: MediaType;

  @Column({ type: 'varchar', length: 160, nullable: true })
  caption: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
