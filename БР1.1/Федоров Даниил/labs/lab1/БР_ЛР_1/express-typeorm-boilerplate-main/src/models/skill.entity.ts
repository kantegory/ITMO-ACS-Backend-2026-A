import {BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import { ResumeSkill } from './resume-skill.entity';
import { VacancySkill } from './vacancy-skill.entity';

@Entity('skills')
export class Skill extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'skill_id'})
    skillId: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

    @OneToMany(() => ResumeSkill, (resumeSkill) => resumeSkill.skill)
    resumeSkills: ResumeSkill[];

    @OneToMany(() => VacancySkill, (vacancySkill) => vacancySkill.skill)
    vacancySkills: VacancySkill[];
}