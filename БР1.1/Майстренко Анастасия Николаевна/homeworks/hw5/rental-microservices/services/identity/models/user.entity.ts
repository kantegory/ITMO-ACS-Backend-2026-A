import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity,
} from 'typeorm';

export enum UserRole {
    TENANT = 'tenant',
    LANDLORD = 'landlord',
    ADMIN = 'admin',
}

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 150 })
    password: string;

    @Column({ type: 'varchar', length: 150 })
    firstName: string;

    @Column({ type: 'varchar', length: 150 })
    lastName: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl: string | null;

    @Column({ type: 'varchar', length: 20, default: UserRole.TENANT })
    role: UserRole;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
