import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable,
} from 'typeorm';
import { EmploymentType, Schedule, ResumeStatus } from './enums';
import { JobSeeker } from './JobSeeker';
import { WorkExperience } from './WorkExperience';
import { Education } from './Education';
import { Skill } from './Skill';
import { Application } from './Application';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => JobSeeker, (s) => s.resumes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_seeker_id' })
  jobSeeker!: JobSeeker;

  @Column({ name: 'job_seeker_id' })
  jobSeekerId!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'integer', nullable: true, name: 'salary_expected' })
  salaryExpected?: number | null;

  @Column({ type: 'varchar', length: 10, default: 'RUB' })
  currency!: string;

  @Column({ type: 'enum', enum: EmploymentType, nullable: true, name: 'employment_type' })
  employmentType?: EmploymentType | null;

  @Column({ type: 'enum', enum: Schedule, nullable: true })
  schedule?: Schedule | null;

  @Column({ type: 'enum', enum: ResumeStatus, default: ResumeStatus.ACTIVE })
  status!: ResumeStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => WorkExperience, (w) => w.resume, { cascade: true })
  workExperiences?: WorkExperience[];

  @OneToMany(() => Education, (e) => e.resume, { cascade: true })
  educations?: Education[];

  @ManyToMany(() => Skill, (s) => s.resumes)
  @JoinTable({
    name: 'resume_skills',
    joinColumn: { name: 'resume_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills?: Skill[];

  @OneToMany(() => Application, (a) => a.resume)
  applications?: Application[];
}
