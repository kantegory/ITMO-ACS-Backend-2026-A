import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Carpet } from './carpet.entity';

@Entity()
@Unique(['user', 'carpet'])
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    user: User;

    @Index()
    @ManyToOne(() => Carpet, (carpet) => carpet.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    carpet: Carpet;

    @Column({ type: 'int', nullable: false })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}

