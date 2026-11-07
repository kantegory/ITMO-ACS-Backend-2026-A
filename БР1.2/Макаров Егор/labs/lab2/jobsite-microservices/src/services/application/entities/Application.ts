import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { ApplicationStatus } from '../../../common/enums';

@Entity('applications')
@Unique(['vacancyId', 'resumeId'])
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'vacancy_id' })
  vacancyId!: number;

  @Column({ name: 'resume_id' })
  resumeId!: number;

  // денормализованные ссылки для запросов соискателя/работодателя без обращения к другим БД
  @Column({ name: 'job_seeker_id' })
  jobSeekerId!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @Column({ type: 'text', nullable: true, name: 'cover_letter' })
  coverLetter?: string | null;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status!: ApplicationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
