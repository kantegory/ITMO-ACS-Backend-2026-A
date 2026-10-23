import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { User } from './user.entity';
import { TokenType } from '@jobsearch/common';

@Entity('verification_tokens')
@Index(['userId', 'type'])
export class VerificationToken extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'enum', enum: TokenType })
    type: TokenType;

    @Column({ type: 'varchar', length: 128, nullable: false })
    codeHash: string;

    @Column({ type: 'timestamp', nullable: false })
    expiresAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    usedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}
