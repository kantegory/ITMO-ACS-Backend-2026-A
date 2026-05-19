import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'comments' })
@Index(['recipeId'])
@Index(['authorId'])
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'comment_id' })
    id: number;

    @Column({ name: 'recipe_id', type: 'int' })
    recipeId: number;

    @Column({ name: 'author_id', type: 'int' })
    authorId: number;

    @Column({ type: 'text' })
    content: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
