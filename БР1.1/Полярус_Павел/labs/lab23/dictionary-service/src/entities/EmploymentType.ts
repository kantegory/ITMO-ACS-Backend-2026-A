import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('employment_types')
export class EmploymentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;
}
