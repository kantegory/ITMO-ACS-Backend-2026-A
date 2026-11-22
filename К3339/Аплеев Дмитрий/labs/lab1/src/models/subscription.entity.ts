import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Check,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
@Unique(['follower_id', 'author_id'])
@Check(`"follower_id" <> "author_id"`)
export class Subscription extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    follower_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'follower_id' })
    follower: User;

    @Column({ type: 'int' })
    author_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @CreateDateColumn()
    created_at: Date;
}
