import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
} from 'typeorm';

import { Recipe } from './recipe.entity';

@Entity()
export class RecipeStep extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    stepNumber: number;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    photoUrl: string;

    @ManyToOne(() => Recipe, (recipe) => recipe.steps, { nullable: false })
    recipe: Recipe;
}
