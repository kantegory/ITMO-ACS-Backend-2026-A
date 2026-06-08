import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity({ name: 'categories' })
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true })
  title: string;

  @Column({ type: 'boolean', default: true, name: 'is_published' })
  is_published: boolean;
}