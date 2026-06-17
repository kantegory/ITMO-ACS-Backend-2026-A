import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Education } from './Education';

@Entity('degree_types')
export class DegreeType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => Education, (edu) => edu.degreeType)
  educations: Education[];
}
