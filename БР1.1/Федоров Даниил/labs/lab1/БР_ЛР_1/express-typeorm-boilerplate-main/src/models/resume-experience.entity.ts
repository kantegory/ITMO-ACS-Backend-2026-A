import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_experience')
export class ResumeExperience extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'resume_experience_id'})
    resumeExperienceId: number;

    @ManyToOne(() => Resume, (resume) => resume.experiences, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'resume_id'})
    resume: Resume;

    @Column({name: 'company_name', type: 'varchar', length: 255})
    companyName: string;

    @Column({type: 'varchar', length: 255})
    position: string;

    @Column({ type: 'text', default: ''})
    description: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;
    
    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate?: Date | null;
}
