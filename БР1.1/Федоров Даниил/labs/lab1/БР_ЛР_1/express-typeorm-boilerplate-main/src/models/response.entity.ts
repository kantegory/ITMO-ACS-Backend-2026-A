import {BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import { Vacancy } from './vacancy.entity';
import { Resume } from './resume.entity';
import { ResponseStatus } from './enums';
import { CoverLetter } from './cover-letter.entity';

@Entity('responses')
@Unique('uq_vacancy_resume_response', ['vacancy', 'resume'])
export class ApplicationResponse extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'response_id' })
    responseId: number;

    @ManyToOne(() => Vacancy, (vacancy) => vacancy.responses, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @ManyToOne(() => Resume, (resume) => resume.responses, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'resume_id' })
    resume: Resume;

    @Column({type: 'enum', enum: ResponseStatus, default: ResponseStatus.NEW})
    status: ResponseStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    
    @OneToOne(() => CoverLetter, (coverLetter) => coverLetter.response)
    coverLetter?: CoverLetter;
}