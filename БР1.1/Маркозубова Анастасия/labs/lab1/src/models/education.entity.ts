import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Resume } from './resume.entity';

@Entity('educations')
export class Education extends BaseEntity {
    @PrimaryGeneratedColumn()
    education_id: number;

    @ManyToOne(() => Resume, (resume) => resume.educations, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Column({ type: 'varchar', length: 255, nullable: false })
    institution: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    degree: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    field_of_study: string;

    @Column({ type: 'date', nullable: false })
    start_date: Date;

    @Column({ type: 'date', nullable: true })
    end_date: Date;
}
