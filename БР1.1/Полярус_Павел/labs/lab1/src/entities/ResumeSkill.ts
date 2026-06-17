import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Resume } from './Resume';
import { Skill } from './Skill';

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

  @ManyToOne(() => Resume, (resume) => resume.resumeSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'uuid' })
  skill_id: string;

  @ManyToOne(() => Skill, (skill) => skill.resumeSkills)
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'enum', enum: SkillLevel })
  level: SkillLevel;
}
