import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { Recipe } from './recipe.entity';

export enum RecipeMediaType {
    IMAGE = 'image',
    VIDEO = 'video',
}

@Entity({ name: 'recipe_media' })
@Unique(['recipe', 'sortOrder'])
export class RecipeMedia extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'media_id' })
    id: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.media, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @Column({ name: 'media_type', type: 'varchar', length: 16 })
    mediaType: RecipeMediaType;

    @Column({ type: 'varchar', length: 1024 })
    url: string;

    @Column({ name: 'sort_order', type: 'int' })
    sortOrder: number;
}
