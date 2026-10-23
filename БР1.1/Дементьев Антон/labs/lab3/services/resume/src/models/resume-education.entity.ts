import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Resume } from './resume.entity';

@Entity('resume_educations')
export class ResumeEducation extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @ManyToOne(() => Resume, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Column({ type: 'varchar', length: 200, nullable: false })
    institution: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    degree: string | null;

    @Column({ type: 'varchar', length: 200, nullable: true })
    fieldOfStudy: string | null;

    @Column({ type: 'int', nullable: false })
    startYear: number;

    @Column({ type: 'int', nullable: true })
    endYear: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
