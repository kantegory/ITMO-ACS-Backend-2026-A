import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Vacancy } from './Vacancy';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'varchar', nullable: true })
  logo_url: string | null;

  @Column({ type: 'uuid', nullable: true })
  industry_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Vacancy, (v) => v.company)
  vacancies: Vacancy[];
}
