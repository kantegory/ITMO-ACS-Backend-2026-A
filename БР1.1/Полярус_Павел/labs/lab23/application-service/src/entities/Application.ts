import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

export enum ApplicationStatus {
    PENDING = 'PENDING',
    VIEWED = 'VIEWED',
    INVITED = 'INVITED',
    REJECTED = 'REJECTED',
    ACCEPTED = 'ACCEPTED',
}

@Entity('applications')
@Unique(['resumeId', 'vacancyId'])
export class Application {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    resumeId: string;

    @Column('uuid')
    vacancyId: string;

    @Column('uuid')
    seekerUserId: string;

    @Column('text', { nullable: true })
    coverLetter: string | null;

    @Column('enum', {
        enum: ApplicationStatus,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
