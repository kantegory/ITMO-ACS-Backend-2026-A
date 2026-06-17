import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Resume } from './resume.entity';
import { Vacancy } from './vacancy.entity';

@Entity('applications')
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn()
    application_id: number;

    @ManyToOne(() => Resume, (resume) => resume.applications, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @ManyToOne(() => Vacancy, (vacancy) => vacancy.applications, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @Column({ type: 'text', nullable: true })
    cover_letter: string;

    @Column({ type: 'varchar', length: 20, nullable: false, default: 'sent' })
    status: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
