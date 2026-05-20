import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { BlogPost } from "./BlogPost";

@Entity("blog_comments")
export class BlogComment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  content: string;

  @ManyToOne(() => User, (u) => u.comments, { onDelete: "CASCADE" })
  @JoinColumn()
  author: User;

  @ManyToOne(() => BlogPost, (p) => p.comments, { onDelete: "CASCADE" })
  @JoinColumn()
  post: BlogPost;

  @CreateDateColumn()
  createdAt: Date;
}
