import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { ApplicationStatus } from './enums/application-status.enum';

@Entity({ name: 'applications' })
@Index(['vacancyId', 'resumeId'], { unique: true })
export class Application extends AuditedEntity {
    @Expose({ name: 'vacancy_id' })
    @Index()
    @Column({ name: 'vacancy_id', type: 'uuid' })
    vacancyId: string;

    @Expose({ name: 'resume_id' })
    @Index()
    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @Expose({ name: 'user_id' })
    @Index()
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Expose({ name: 'cover_letter' })
    @Column({ name: 'cover_letter', type: 'text', nullable: true })
    coverLetter?: string | null;

    @Expose()
    @Column({
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

}
