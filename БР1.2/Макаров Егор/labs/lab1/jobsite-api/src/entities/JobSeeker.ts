import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './User';
import { Resume } from './Resume';
import { SavedVacancy } from './SavedVacancy';

@Entity('job_seekers')
export class JobSeeker {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (u) => u.jobSeeker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  about?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Resume, (r) => r.jobSeeker)
  resumes?: Resume[];

  @OneToMany(() => SavedVacancy, (sv) => sv.jobSeeker)
  savedVacancies?: SavedVacancy[];
}
