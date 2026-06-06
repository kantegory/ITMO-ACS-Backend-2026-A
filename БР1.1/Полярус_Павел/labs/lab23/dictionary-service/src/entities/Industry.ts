import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('industries')
export class Industry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;
}
