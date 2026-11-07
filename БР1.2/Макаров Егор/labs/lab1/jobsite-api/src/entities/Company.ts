import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { CompanySize } from './enums';
import { Industry } from './Industry';
import { Employer } from './Employer';
import { Vacancy } from './Vacancy';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' })
  logoUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string | null;

  @ManyToOne(() => Industry, (i) => i.companies, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'industry_id' })
  industry?: Industry | null;

  @Column({ name: 'industry_id', nullable: true })
  industryId?: number | null;

  @Column({ type: 'enum', enum: CompanySize, nullable: true })
  size?: CompanySize | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Employer, (e) => e.company)
  employers?: Employer[];

  @OneToMany(() => Vacancy, (v) => v.company)
  vacancies?: Vacancy[];
}
