import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    Unique,
} from 'typeorm';

// рецепт можно сохранить только один раз
@Entity()
@Unique(['recipe_id', 'user_id'])
export class SavedRecipe extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    recipe_id: number;

    @Column({ type: 'int' })
    user_id: number;

    @CreateDateColumn()
    created_at: Date;
}
