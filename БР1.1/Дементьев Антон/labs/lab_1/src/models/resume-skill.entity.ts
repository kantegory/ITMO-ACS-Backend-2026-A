import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Resume } from './resume.entity';
import { Skill } from './skill.entity';

@Entity('resume_skills')
@Unique(['resumeId', 'skillId'])
export class ResumeSkill extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @ManyToOne(() => Resume, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Index()
    @Column({ name: 'skill_id', type: 'uuid' })
    skillId: string;

    @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'skill_id' })
    skill: Skill;

    @CreateDateColumn()
    createdAt: Date;
}
