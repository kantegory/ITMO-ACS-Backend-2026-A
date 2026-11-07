import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';

import { DishType, Difficulty } from './enums';
import { User } from './user.entity';
import { Ingredient } from './ingredient.entity';

@Entity()
export class Recipe extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // сам внешний ключ — удобно, когда нужен только id автора
    @Column({ type: 'int' })
    author_id: number;

    // связь с автором — TypeORM подгрузит объект User, если попросить
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'enum', enum: DishType })
    dish_type: DishType;

    @Column({ type: 'enum', enum: Difficulty })
    difficulty: Difficulty;

    // время приготовления в минутах
    @Column({ type: 'int' })
    cooking_time: number;

    // шаги рецепта — массив строк, хранится в одной колонке JSONB
    @Column({ type: 'jsonb', default: [] })
    steps: string[];

    @Column({ type: 'varchar', length: 500, nullable: true })
    image_url: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    video_url: string | null;

    // cascade: ингредиенты сохраняются вместе с рецептом одним save()
    @OneToMany(() => Ingredient, (ingredient) => ingredient.recipe, {
        cascade: true,
    })
    ingredients: Ingredient[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
