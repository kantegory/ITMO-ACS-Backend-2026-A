import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { User } from './User';
import { Company } from './Company';
import { Vacancy } from './Vacancy';

@Entity('employers')
export class Employer {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (u) => u.employer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => Company, (c) => c.employers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company?: Company | null;

  @Column({ name: 'company_id', nullable: true })
  companyId?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Vacancy, (v) => v.employer)
  vacancies?: Vacancy[];
}
