import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';

@Entity({ name: 'application_created_events' })
export class ApplicationCreatedEventLog extends AuditedEntity {
    @Expose({ name: 'event_id' })
    @Index({ unique: true })
    @Column({ name: 'event_id', type: 'uuid' })
    eventId: string;

    @Expose({ name: 'event_type' })
    @Column({ name: 'event_type', type: 'varchar', length: 100 })
    eventType: string;

    @Expose({ name: 'occurred_at' })
    @Column({ name: 'occurred_at', type: 'timestamptz' })
    occurredAt: Date;

    @Expose({ name: 'application_id' })
    @Index()
    @Column({ name: 'application_id', type: 'uuid' })
    applicationId: string;

    @Expose({ name: 'vacancy_id' })
    @Index()
    @Column({ name: 'vacancy_id', type: 'uuid' })
    vacancyId: string;

    @Expose({ name: 'applicant_id' })
    @Index()
    @Column({ name: 'applicant_id', type: 'uuid' })
    applicantId: string;

    @Expose({ name: 'resume_id' })
    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @Expose()
    @Column({ type: 'varchar', length: 50 })
    status: string;
}
