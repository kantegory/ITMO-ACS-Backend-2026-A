import {BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import { ApplicationResponse } from './response.entity';

@Entity('cover_letter')
export class CoverLetter extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'cover_letter_id' })
    coverLetterId: number;

    @OneToOne(() => ApplicationResponse, (response) => response.coverLetter, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'response_id' })
    response: ApplicationResponse;

    @Column({ type: 'text' })
    text: string;
}