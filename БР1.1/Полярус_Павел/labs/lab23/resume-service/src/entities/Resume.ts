import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { WorkExperience } from './WorkExperience';
import { Education } from './Education';
import { ResumeSkill } from './ResumeSkill';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_seeker_id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'int', default: 0 })
  experience_months_cached: number;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => WorkExperience, (we) => we.resume)
  workExperiences: WorkExperience[];

  @OneToMany(() => Education, (edu) => edu.resume)
  educations: Education[];

  @OneToMany(() => ResumeSkill, (rs) => rs.resume)
  resumeSkills: ResumeSkill[];
}
