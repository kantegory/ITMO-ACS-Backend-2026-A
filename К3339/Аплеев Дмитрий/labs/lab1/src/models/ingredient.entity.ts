import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Recipe } from './recipe.entity';

@Entity()
export class Ingredient extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    recipe_id: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.ingredients, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 50 })
    amount: string;
}
