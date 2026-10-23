import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Vacancy } from './vacancy.entity';
import { Resume } from './resume.entity';
import { ApplicationStatus } from './enums';

@Entity('applications')
@Unique(['vacancyId', 'resumeId'])
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vacancy_id', type: 'uuid' })
    vacancyId: string;

    @ManyToOne(() => Vacancy, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @ManyToOne(() => Resume, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Column({
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

    @Column({ type: 'text', nullable: true })
    coverLetter: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
