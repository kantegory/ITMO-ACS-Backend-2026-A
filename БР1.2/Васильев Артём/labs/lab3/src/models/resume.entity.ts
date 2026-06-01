import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { numericTransformer } from '../common/column-transformers';
import { User } from './user.entity';
import { EmploymentType } from './enums/employment-type.enum';
import { WorkFormat } from './enums/work-format.enum';
import { ResumeExperience } from './resume-experience.entity';
import { Application } from './application.entity';

@Entity({ name: 'resumes' })
export class Resume extends AuditedEntity {
    @Expose({ name: 'user_id' })
    @Index()
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Expose()
    @Index()
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Expose({ name: 'desired_position' })
    @Index()
    @Column({ name: 'desired_position', type: 'varchar', length: 255 })
    desiredPosition: string;

    @Expose({ name: 'about_me' })
    @Column({ name: 'about_me', type: 'text' })
    aboutMe: string;

    @Expose()
    @Column({ type: 'text' })
    skills: string;

    @Expose()
    @Column({ type: 'text' })
    education: string;

    @Expose({ name: 'salary_expectation' })
    @Column({
        name: 'salary_expectation',
        type: 'numeric',
        precision: 12,
        scale: 2,
        transformer: numericTransformer,
    })
    salaryExpectation: number;

    @Expose()
    @Index()
    @Column({ type: 'varchar', length: 255 })
    city: string;

    @Expose({ name: 'employment_type' })
    @Column({
        name: 'employment_type',
        type: 'enum',
        enum: EmploymentType,
    })
    employmentType: EmploymentType;

    @Expose({ name: 'work_format' })
    @Column({
        name: 'work_format',
        type: 'enum',
        enum: WorkFormat,
    })
    workFormat: WorkFormat;

    @Expose({ name: 'is_published' })
    @Column({ name: 'is_published', type: 'boolean', default: false })
    isPublished: boolean;

    @ManyToOne(() => User, (user) => user.resumes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Expose()
    @OneToMany(() => ResumeExperience, (experience) => experience.resume, {
        cascade: true,
    })
    experiences: ResumeExperience[];

    @OneToMany(() => Application, (application) => application.resume)
    applications: Application[];
}
