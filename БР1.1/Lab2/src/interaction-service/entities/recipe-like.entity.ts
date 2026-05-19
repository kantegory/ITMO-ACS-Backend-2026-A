import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

@Entity({ name: 'recipe_likes' })
@Unique(['recipeId', 'userId'])
@Index(['recipeId'])
@Index(['userId'])
export class RecipeLike extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'like_id' })
    id: number;

    @Column({ name: 'recipe_id', type: 'int' })
    recipeId: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
