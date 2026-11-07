import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    Unique,
} from 'typeorm';

// один пользователь — один лайк на рецепт
@Entity()
@Unique(['recipe_id', 'user_id'])
export class Like extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    recipe_id: number;

    @Column({ type: 'int' })
    user_id: number;

    @CreateDateColumn()
    created_at: Date;
}
