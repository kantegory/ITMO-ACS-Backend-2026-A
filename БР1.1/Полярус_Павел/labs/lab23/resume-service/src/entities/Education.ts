import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Resume } from './Resume';

@Entity('educations')
export class Education {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  resume_id: string;

  @ManyToOne(() => Resume, (r) => r.educations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ type: 'uuid' })
  degree_type_id: string;

  @Column({ type: 'varchar' })
  institution: string;

  @Column({ type: 'varchar', nullable: true })
  program_name: string | null;

  @Column({ type: 'date', nullable: true })
  start_date: string | null;

  @Column({ type: 'date', nullable: true })
  end_date: string | null;
}
