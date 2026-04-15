import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    user_id!: number;

    @Column({ type: 'int', nullable: true })
    role_id!: number;

    @ManyToOne(() => Role, { eager: false, nullable: true })
    @JoinColumn({ name: 'role_id' })
    role!: Role;

    @Column({ type: 'varchar', length: 150, nullable: true })
    first_name!: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    middle_name!: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    last_name!: string;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email!: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    phone!: string;

    @Column({ type: 'varchar', length: 300, nullable: false })
    password_hash!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    edited_at!: Date;
}
