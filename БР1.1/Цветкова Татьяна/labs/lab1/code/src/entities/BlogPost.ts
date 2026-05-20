import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { BlogCategory } from "./BlogCategory";
import { BlogComment } from "./BlogComment";

@Entity("blog_posts")
export class BlogPost {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "text" })
  summary: string;

  @Column({ type: "text" })
  content: string;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column({ type: "simple-array", nullable: true })
  tags?: string[];

  @Column({ default: false })
  published: boolean;

  @ManyToOne(() => User, (u) => u.posts, { onDelete: "SET NULL", nullable: true })
  @JoinColumn()
  author?: User;

  @ManyToOne(() => BlogCategory, (c) => c.posts, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn()
  category?: BlogCategory;

  @OneToMany(() => BlogComment, (c) => c.post)
  comments: BlogComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
