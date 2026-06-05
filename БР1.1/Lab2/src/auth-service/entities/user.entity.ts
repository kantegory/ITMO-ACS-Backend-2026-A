import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'user_id' })
    id: number;

    @Column({ type: 'varchar', length: 50, unique: true })
    username: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ name: 'password_hash', type: 'varchar', length: 255 })
    passwordHash: string;

    @Column({ type: 'text', nullable: true })
    bio: string | null;

    @Column({ name: 'avatar_url', type: 'varchar', length: 1024, nullable: true })
    avatarUrl: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
