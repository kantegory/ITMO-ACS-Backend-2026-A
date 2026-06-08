import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Company } from '../company/company.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  OWNER = 'OWNER',
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  first_name: string;

  @Column({ type: 'varchar', length: 64 })
  last_name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  middle_name: string | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  is_verified: boolean;

  // Связь с компанией (один пользователь - одна компания)
  @OneToOne(() => Company, (company) => company.user)
  company: Company | null;
}