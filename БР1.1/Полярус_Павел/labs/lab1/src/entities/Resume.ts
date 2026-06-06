import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobSeeker } from './JobSeeker';
import { WorkExperience } from './WorkExperience';
import { Education } from './Education';
import { ResumeSkill } from './ResumeSkill';
import { Application } from './Application';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_seeker_id: string;

  @ManyToOne(() => JobSeeker, (seeker) => seeker.resumes)
  @JoinColumn({ name: 'job_seeker_id' })
  jobSeeker: JobSeeker;

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

  @OneToMany(() => Application, (app) => app.resume)
  applications: Application[];
}
