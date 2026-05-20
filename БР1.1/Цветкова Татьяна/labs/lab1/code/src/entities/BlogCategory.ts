import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BlogPost } from "./BlogPost";

@Entity("blog_categories")
export class BlogCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => BlogPost, (p) => p.category)
  posts: BlogPost[];
}
