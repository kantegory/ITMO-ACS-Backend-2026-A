import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToMany,
} from 'typeorm';

import { Recipe } from './recipe.entity';

@Entity()
export class DishType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 150, unique: true, nullable: false })
    name: string;

    @ManyToMany(() => Recipe, (recipe) => recipe.dishTypes)
    recipes: Recipe[];
}
