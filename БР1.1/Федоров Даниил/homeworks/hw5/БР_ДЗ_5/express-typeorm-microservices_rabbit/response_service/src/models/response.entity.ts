import {BaseEntity, Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import { ResponseStatus } from './enums';
import { CoverLetter } from './cover-letter.entity';

@Entity('responses')
@Unique('uq_vacancy_resume_response', ['vacancyId', 'resumeId'])
export class ApplicationResponse extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'response_id' })
    responseId: number;

    @Column({name: 'vacancy_id', type: 'int'})
    vacancyId: number;


    @Column({name: 'resume_id', type: 'int'})
    resumeId: number;


    @Column({name: 'seeker_id', type: 'int'})
    seekerId: number;


    @Column({name: 'employer_id', type: 'int'})
    employerId: number;


    @Column({type: 'enum', enum: ResponseStatus, default: ResponseStatus.NEW})
    status: ResponseStatus;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    
    @OneToOne(() => CoverLetter, (coverLetter) => coverLetter.response)
    coverLetter?: CoverLetter;
}