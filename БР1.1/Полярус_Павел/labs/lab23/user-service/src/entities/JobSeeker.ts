import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

@Entity('job_seekers')
export class JobSeeker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToOne(() => User, (user) => user.jobSeeker)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  city_id: string;

  @Column({ type: 'varchar' })
  first_name: string;

  @Column({ type: 'varchar' })
  last_name: string;

  @Column({ type: 'varchar', nullable: true })
  middle_name: string | null;

  @Column({ type: 'date', nullable: true })
  birth_date: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;
}
