import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Service } from './service.entity';
import { Category } from '../category/category.entity';

@Entity({ name: 'service_categories' })
export class ServiceCategory extends BaseEntity {
  @ManyToOne(() => Service, (service) => service.service_categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'service_id' }) 
  service_id: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  category_id: number;
}