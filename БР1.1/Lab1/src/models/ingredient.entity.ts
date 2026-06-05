import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { RecipeIngredient } from './recipe-ingredient.entity';

@Entity({ name: 'ingredients' })
export class Ingredient extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'ingredient_id' })
    id: number;

    @Column({ type: 'varchar', length: 160, unique: true })
    name: string;

    @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.ingredient)
    recipeIngredients: RecipeIngredient[];
}
