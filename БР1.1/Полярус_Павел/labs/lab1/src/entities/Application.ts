import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Resume } from './Resume';
import { Vacancy } from './Vacancy';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  INVITED = 'INVITED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
}

@Unique(['resume_id', 'vacancy_id'])
@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  resume_id: string;

  @ManyToOne(() => Resume, (resume) => resume.applications)
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'uuid' })
  vacancy_id: string;

  @ManyToOne(() => Vacancy, (vacancy) => vacancy.applications)
  @JoinColumn({ name: 'vacancy_id' })
  vacancy: Vacancy;

  @Column({ type: 'text', nullable: true })
  cover_letter: string | null;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
