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

@Entity('resume_experiences')
export class ResumeExperience extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'resume_id', type: 'uuid' })
    resumeId: string;

    @ManyToOne(() => Resume, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Column({ type: 'varchar', length: 200, nullable: false })
    companyName: string;

    @Column({ type: 'varchar', length: 200, nullable: false })
    position: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'date', nullable: false })
    startDate: string;

    @Column({ type: 'date', nullable: true })
    endDate: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
