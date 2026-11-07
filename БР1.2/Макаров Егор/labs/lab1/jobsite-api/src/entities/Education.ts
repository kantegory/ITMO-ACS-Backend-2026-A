import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Resume } from './Resume';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Resume, (r) => r.educations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume!: Resume;

  @Column({ name: 'resume_id' })
  resumeId!: number;

  @Column({ type: 'varchar', length: 255 })
  institution!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  degree?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'field_of_study' })
  fieldOfStudy?: string | null;

  @Column({ type: 'integer', name: 'start_year' })
  startYear!: number;

  @Column({ type: 'integer', nullable: true, name: 'end_year' })
  endYear?: number | null;
}
