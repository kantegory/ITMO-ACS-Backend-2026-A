import { Column, Entity, Index, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Recipe } from './Recipe';

/** Свободная метка рецепта: #веган, #быстро, #праздничное. */
@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 48 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 48 })
  slug: string;

  @ManyToMany(() => Recipe, (recipe) => recipe.tags)
  recipes: Recipe[];
}
