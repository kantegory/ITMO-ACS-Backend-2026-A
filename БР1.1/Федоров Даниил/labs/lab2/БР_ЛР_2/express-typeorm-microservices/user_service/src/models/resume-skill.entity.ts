import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_skills')
@Unique('uq_resume_skill', ['resume', 'skillId'])
export class ResumeSkill extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'id'})
    id: number;

    @ManyToOne(() => Resume, (resume) => resume.resumeSkills, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'resume_id'})
    resume: Resume;
    
    @Column({name: 'skill_id', type: 'int'})
    skillId: number;

}