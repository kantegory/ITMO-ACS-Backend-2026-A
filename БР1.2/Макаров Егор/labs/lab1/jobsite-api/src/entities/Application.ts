import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { ApplicationStatus } from './enums';
import { Vacancy } from './Vacancy';
import { Resume } from './Resume';

@Entity('applications')
@Unique(['vacancyId', 'resumeId'])
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Vacancy, (v) => v.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy!: Vacancy;

  @Column({ name: 'vacancy_id' })
  vacancyId!: number;

  @ManyToOne(() => Resume, (r) => r.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume!: Resume;

  @Column({ name: 'resume_id' })
  resumeId!: number;

  @Column({ type: 'text', nullable: true, name: 'cover_letter' })
  coverLetter?: string | null;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status!: ApplicationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
