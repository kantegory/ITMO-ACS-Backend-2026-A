import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('degree_types')
export class DegreeType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;
}
