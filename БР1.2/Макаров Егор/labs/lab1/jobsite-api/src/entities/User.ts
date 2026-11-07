import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne,
} from 'typeorm';
import { UserRole } from './enums';
import { JobSeeker } from './JobSeeker';
import { Employer } from './Employer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => JobSeeker, (s) => s.user)
  jobSeeker?: JobSeeker;

  @OneToOne(() => Employer, (e) => e.user)
  employer?: Employer;
}
