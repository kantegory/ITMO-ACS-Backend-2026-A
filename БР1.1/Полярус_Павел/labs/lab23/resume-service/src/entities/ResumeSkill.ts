import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Resume } from './Resume';

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

@Unique(['resume_id', 'skill_id'])
@Entity('resume_skills')
export class ResumeSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  resume_id: string;

  @ManyToOne(() => Resume, (r) => r.resumeSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'uuid' })
  skill_id: string;

  @Column({ type: 'enum', enum: SkillLevel })
  level: SkillLevel;
}
