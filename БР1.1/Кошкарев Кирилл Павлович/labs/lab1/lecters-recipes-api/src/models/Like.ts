import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Recipe } from './Recipe';
import { User } from './User';

/** Лайк рецепта. Пара (пользователь, рецепт) уникальна. */
@Entity('likes')
@Unique('uq_like', ['userId', 'recipeId'])
export class Like {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  userId: string;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'bigint' })
  recipeId: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipeId' })
  recipe: Recipe;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
