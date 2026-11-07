import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm';
import { Company } from './Company';

@Entity('industries')
export class Industry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @OneToMany(() => Company, (c) => c.industry)
  companies?: Company[];
}
