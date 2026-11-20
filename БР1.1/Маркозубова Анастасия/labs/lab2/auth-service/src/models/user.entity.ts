import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    UpdateDateColumn,
    CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    user_id: number;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 300, nullable: false })
    password_hash: string;

    @Column({ type: 'varchar', length: 20, nullable: false })
    user_role: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
