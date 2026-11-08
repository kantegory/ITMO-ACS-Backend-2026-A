import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_categories' })
export class RecipeCategory extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'category_id' })
    id: number;

    @Column({ type: 'varchar', length: 120, unique: true })
    name: string;

    @OneToMany(() => Recipe, (recipe) => recipe.category)
    recipes: Recipe[];
}
