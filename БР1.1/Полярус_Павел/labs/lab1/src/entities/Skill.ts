import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ResumeSkill } from './ResumeSkill';
import { VacancySkill } from './VacancySkill';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => ResumeSkill, (rs) => rs.skill)
  resumeSkills: ResumeSkill[];

  @OneToMany(() => VacancySkill, (vs) => vs.skill)
  vacancySkills: VacancySkill[];
}
