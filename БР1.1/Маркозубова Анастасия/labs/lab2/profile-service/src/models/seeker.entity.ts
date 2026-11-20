import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('seekers')
export class Seeker extends BaseEntity {
    @PrimaryGeneratedColumn()
    seeker_id: number;

    @Column({ type: 'integer', nullable: false, unique: true })
    user_id: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    first_name: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    last_name: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'text', nullable: true })
    contact_info: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
