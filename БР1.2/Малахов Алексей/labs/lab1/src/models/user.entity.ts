import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', nullable: false })
    firstName: string;

    @Column({ type: 'varchar', nullable: false })
    lastName: string;

    @Column({ type: 'varchar', unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false })
    passwordHash: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string;

    @Column({ type: 'varchar', nullable: true })
    avatarUrl: string;

    @Column({ type: 'boolean', nullable: false, default: true })
    isActive: boolean;

    @Column({ type: 'boolean', nullable: false, default: false })
    isVerified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
