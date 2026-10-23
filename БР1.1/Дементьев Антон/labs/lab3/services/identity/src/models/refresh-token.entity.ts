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

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 128, unique: true, nullable: false })
    tokenHash: string;

    @Column({ type: 'timestamp', nullable: false })
    expiresAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    revokedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;
}
