import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

export enum BlogCategory {
  NUTRITION = "nutrition",
  HEALTH = "health",
  MOTIVATION = "motivation",
  RECOVERY = "recovery",
  SCIENCE = "science",
}

@Entity("blog_posts")
export class BlogPost {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ nullable: true })
  featured_image: string;

  @Column({ type: "simple-enum", enum: BlogCategory })
  category: BlogCategory;

  @Column()
  author_id: string;

  @ManyToOne(() => User)
  author: User;

  @CreateDateColumn()
  created_at: Date;
}
