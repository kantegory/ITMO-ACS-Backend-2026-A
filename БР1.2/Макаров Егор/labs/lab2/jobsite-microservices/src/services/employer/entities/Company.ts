import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { CompanySize } from '../../../common/enums';

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

  // ссылка на отрасль из Catalog Service (без внешнего ключа на чужую БД)
  @Column({ type: 'int', name: 'industry_id', nullable: true })
  industryId?: number | null;

  @Column({ type: 'enum', enum: CompanySize, nullable: true })
  size?: CompanySize | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
