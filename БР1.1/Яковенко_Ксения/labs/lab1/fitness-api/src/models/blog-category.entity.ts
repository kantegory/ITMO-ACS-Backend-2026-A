import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';

@Entity('blog_categories')
export class BlogCategory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;
}