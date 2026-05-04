import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resume } from './Resume';

@Entity('work_experiences')
export class WorkExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  resume_id: string;

  @ManyToOne(() => Resume, (resume) => resume.workExperiences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'varchar' })
  company_name: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string | null;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;
}
