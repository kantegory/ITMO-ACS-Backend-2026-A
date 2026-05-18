import {BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany,PrimaryGeneratedColumn,} from 'typeorm';
import { Seeker } from './seeker.entity';
import { ResumeSkill } from './resume-skill.entity';
import { Education } from './education.entity';
import { ResumeExperience } from './resume-experience.entity';
import { ApplicationResponse } from './response.entity';

@Entity('resumes')
export class Resume extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'resume_id'})
    resumeId: number;

    @ManyToOne(() => Seeker, (seeker) => seeker.resumes, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'profile_id'})
    seeker: Seeker;

    @Column({ type: 'varchar', length: 255, default: 'Новое резюме' })
    title: string;

    @Column({name: 'about_me', type: 'text', default: '' })
    aboutMe: string;

    @CreateDateColumn({name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @OneToMany (() => Education, (education) => education.resume)
    educations: Education[];

    @OneToMany (() => ResumeExperience, (experience) => experience.resume)
    experiences: ResumeExperience[];

    @OneToMany (() => ResumeSkill, (resumeSkill) => resumeSkill.resume)
    resumeSkills: ResumeSkill[];

    @OneToMany(() => ApplicationResponse, (response) => response.resume)
    responses: ApplicationResponse[];


}

