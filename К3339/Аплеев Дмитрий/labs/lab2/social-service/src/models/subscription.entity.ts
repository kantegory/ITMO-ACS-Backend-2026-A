import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    Unique,
    Check,
} from 'typeorm';

// follower подписан на author; повторно подписаться и подписаться на себя нельзя
@Entity()
@Unique(['follower_id', 'author_id'])
@Check(`"follower_id" <> "author_id"`)
export class Subscription extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    follower_id: number;

    @Column({ type: 'int' })
    author_id: number;

    @CreateDateColumn()
    created_at: Date;
}
