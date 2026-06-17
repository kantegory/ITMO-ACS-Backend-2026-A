import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Seeker } from './seeker.entity';
import { Specialization } from './specialization.entity';
import { Education } from './education.entity';
import { Experience } from './experience.entity';
import { Application } from './application.entity';

@Entity('resumes')
export class Resume extends BaseEntity {
    @PrimaryGeneratedColumn()
    resume_id: number;

    @ManyToOne(() => Seeker, (seeker) => seeker.resumes, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'seeker_id' })
    seeker: Seeker;

    @ManyToOne(() => Specialization, (specialization) => specialization.resumes, {
        nullable: false,
    })
    @JoinColumn({ name: 'specialization_id' })
    specialization: Specialization;

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

    @OneToMany(() => Application, (application) => application.resume)
    applications: Application[];
}
