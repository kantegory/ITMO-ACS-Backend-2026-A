import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Resume } from './resume.entity';

@Entity('experiences')
export class Experience extends BaseEntity {
    @PrimaryGeneratedColumn()
    experience_id: number;

    @ManyToOne(() => Resume, (resume) => resume.experiences, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Column({ type: 'varchar', length: 255, nullable: false })
    company_name: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    position: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'date', nullable: false })
    start_date: Date;

    @Column({ type: 'date', nullable: true })
    end_date: Date;
}
