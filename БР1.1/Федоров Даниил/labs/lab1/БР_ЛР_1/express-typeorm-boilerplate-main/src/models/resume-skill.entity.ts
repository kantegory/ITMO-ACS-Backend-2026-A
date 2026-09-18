import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import { Resume } from './resume.entity';
import { Skill } from './skill.entity';

@Entity('resume_skills')
@Unique('uq_resume_skill', ['resume', 'skill'])
export class ResumeSkill extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'id'})
    id: number;

    @ManyToOne(() => Resume, (resume) => resume.resumeSkills, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'resume_id'})
    resume: Resume;
    
    @ManyToOne(() => Skill, (skill) => skill.resumeSkills, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'skill_id'})
    skill: Skill;

}