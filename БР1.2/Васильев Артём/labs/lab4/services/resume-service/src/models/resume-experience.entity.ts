import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { Resume } from './resume.entity';

@Entity({ name: 'resume_experiences' })
export class ResumeExperience extends AuditedEntity {
    @Expose({ name: 'resume_id' })
    @Index()
    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @Expose({ name: 'company_name' })
    @Column({ name: 'company_name', type: 'varchar', length: 255 })
    companyName: string;

    @Expose()
    @Column({ type: 'varchar', length: 255 })
    position: string;

    @Expose()
    @Column({ type: 'text' })
    description: string;

    @Expose({ name: 'start_date' })
    @Column({ name: 'start_date', type: 'date' })
    startDate: string;

    @Expose({ name: 'end_date' })
    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate?: string | null;

    @Expose({ name: 'months_count' })
    @Column({ name: 'months_count', type: 'integer' })
    monthsCount: number;

    @ManyToOne(() => Resume, (resume) => resume.experiences, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;
}
