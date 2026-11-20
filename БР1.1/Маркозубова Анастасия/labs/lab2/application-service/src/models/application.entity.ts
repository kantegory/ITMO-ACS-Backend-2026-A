import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
} from 'typeorm';

@Entity('applications')
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn()
    application_id: number;

    @Column({ type: 'integer', nullable: false })
    resume_id: number;

    @Column({ type: 'integer', nullable: false })
    vacancy_id: number;

    @Column({ type: 'text', nullable: true })
    cover_letter: string;

    @Column({ type: 'varchar', length: 20, nullable: false, default: 'sent' })
    status: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
