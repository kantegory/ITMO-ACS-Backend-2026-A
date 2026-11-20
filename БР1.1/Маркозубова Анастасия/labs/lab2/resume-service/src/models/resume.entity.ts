import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';

import { Education } from './education.entity';
import { Experience } from './experience.entity';

@Entity('resumes')
export class Resume extends BaseEntity {
    @PrimaryGeneratedColumn()
    resume_id: number;

    @Column({ type: 'integer', nullable: false })
    seeker_id: number;

    @Column({ type: 'integer', nullable: false })
    specialization_id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'integer', nullable: true })
    desired_salary: number;

    @Column({ type: 'integer', nullable: true })
    experience_years: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @OneToMany(() => Education, (education) => education.resume)
    educations: Education[];

    @OneToMany(() => Experience, (experience) => experience.resume)
    experiences: Experience[];
}
