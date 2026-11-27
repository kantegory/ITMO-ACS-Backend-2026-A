import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, Check } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Company } from './company.entity';
import { ServiceCategory } from './service-category.entity';
import { Discount } from './discount.entity';

@Entity({ name: 'services' })
@Check('"base_price" >= 0')
export class Service extends BaseEntity {
  @Column({ type: 'varchar', length: 256 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_price' })
  base_price: number;

  @Column({ type: 'boolean', default: true, name: 'is_published' })
  is_published: boolean;

  @ManyToOne(() => Company, (company) => company.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  company_id: number;

  @OneToMany(() => ServiceCategory, (serviceCategory) => serviceCategory.service)
  service_categories: ServiceCategory[];

  @OneToOne(() => Discount, (discount) => discount.service)
  discount: Discount | null;
}