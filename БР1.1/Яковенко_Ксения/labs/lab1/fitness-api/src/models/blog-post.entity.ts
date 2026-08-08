import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { BlogCategory } from './blog-category.entity';

export type BlogPostStatus = 'draft' | 'published';

@Entity('blog_posts')
export class BlogPost extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title!: string;

  @Column({ type: 'varchar', length: 200, nullable: false, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'draft' })
  status!: BlogPostStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'int', nullable: false })
  authorId!: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT', eager: false })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @ManyToMany(() => BlogCategory, { eager: true })
  @JoinTable({
    name: 'post_categories',
    joinColumn: {
      name: 'postId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'categoryId',
      referencedColumnName: 'id',
    },
  })
  categories!: BlogCategory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}