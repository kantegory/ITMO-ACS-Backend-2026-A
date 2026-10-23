import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Role } from '@jobsearch/common';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: Role })
    role: Role;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({
        name: 'password_hash',
        type: 'varchar',
        length: 150,
        nullable: false,
    })
    password: string;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
