import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ApplicationStatus } from '@jobsearch/common';

// vacancy_id и resume_id: ссылки на Vacancy и Resume (внешних ключей на другие БД нет).
// applicant_user_id и employer_user_id: копии для проверки прав без обращения к другим сервисам.
@Entity('applications')
@Unique(['vacancyId', 'resumeId'])
export class Application extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Index() @Column({ name: 'vacancy_id', type: 'uuid' }) vacancyId: string;
    @Index() @Column({ name: 'resume_id', type: 'uuid' }) resumeId: string;
    @Index() @Column({ name: 'applicant_user_id', type: 'uuid' }) applicantUserId: string;
    @Index() @Column({ name: 'employer_user_id', type: 'uuid' }) employerUserId: string;
    @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING }) status: ApplicationStatus;
    @Column({ type: 'text', nullable: true }) coverLetter: string | null;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
