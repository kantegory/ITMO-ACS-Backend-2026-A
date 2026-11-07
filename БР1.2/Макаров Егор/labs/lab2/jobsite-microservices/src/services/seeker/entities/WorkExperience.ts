import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Resume } from './Resume';

@Entity('work_experiences')
export class WorkExperience {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Resume, (r) => r.workExperiences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume!: Resume;

  @Column({ name: 'resume_id' })
  resumeId!: number;

  @Column({ type: 'varchar', length: 255, name: 'company_name' })
  companyName!: string;

  @Column({ type: 'varchar', length: 255 })
  position!: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate?: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_current' })
  isCurrent!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string | null;
}
