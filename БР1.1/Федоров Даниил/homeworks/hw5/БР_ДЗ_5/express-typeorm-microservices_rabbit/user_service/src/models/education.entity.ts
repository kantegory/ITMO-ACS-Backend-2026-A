import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Resume } from "./resume.entity";


@Entity('education')
export class Education extends BaseEntity{
    @PrimaryGeneratedColumn({ name: 'education_id'})
    educationId: number;

    @ManyToOne (() => Resume, (resume) => resume.educations, {onDelete: 'CASCADE'})

    @JoinColumn({ name: 'resume_id'})
    resume: Resume;

    @Column({ type: 'varchar', length: 255 })
    institution: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    degree?: string | null;

    @Column({name: 'field_of_study', type: 'varchar', length: 255, nullable: true})
    fieldOfStudy: string;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;
    
    @Column({ name: 'end_date', type: 'date', nullable: true })
    endDate?: Date | null;


}

