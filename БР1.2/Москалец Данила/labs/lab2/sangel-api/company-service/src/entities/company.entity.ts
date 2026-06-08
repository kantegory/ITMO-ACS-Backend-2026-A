import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Service } from './service.entity';

@Entity({ name: 'companies' })
export class Company extends BaseEntity {
  @Column({ type: 'varchar', length: 256 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ name: 'user_id' })
  user_id: number;

  @OneToMany(() => Service, (service) => service.company)
  services: Service[];
}