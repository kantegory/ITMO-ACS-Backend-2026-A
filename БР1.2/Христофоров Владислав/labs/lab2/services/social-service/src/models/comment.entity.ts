import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { BlogPost } from "./blog-post.entity";

@Entity("comments")
export class Comment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    content: string;

    @Column({ type: "uuid" })
    user_id: string;

    @Column({ type: "uuid", nullable: true })
    recipe_id: string;

    @ManyToOne(() => BlogPost, (blog_post) => blog_post.comments, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "blog_post_id" })
    blog_post: BlogPost;

    @CreateDateColumn()
    created_at: Date;
}
