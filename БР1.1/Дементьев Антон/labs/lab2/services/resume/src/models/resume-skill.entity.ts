import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_skills')
@Unique(['resumeId', 'skillId'])
export class ResumeSkill extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ name: 'resume_id', type: 'uuid' }) resumeId: string;
    @ManyToOne(() => Resume, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'resume_id' }) resume: Resume;
    @Index() @Column({ name: 'skill_id', type: 'uuid' }) skillId: string;
    @CreateDateColumn() createdAt: Date;
}
