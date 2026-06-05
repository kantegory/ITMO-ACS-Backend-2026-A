import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Recipe } from './recipe.entity';

@Entity({ name: 'difficulty_levels' })
export class DifficultyLevel extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'difficulty_id' })
    id: number;

    @Column({ type: 'varchar', length: 120, unique: true })
    name: string;

    @OneToMany(() => Recipe, (recipe) => recipe.difficulty)
    recipes: Recipe[];
}
