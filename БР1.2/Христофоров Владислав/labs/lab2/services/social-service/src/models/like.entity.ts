import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Check,
} from "typeorm";
import { BlogPost } from "./blog-post.entity";

@Entity("likes")
@Check(
    `("recipe_id" IS NOT NULL AND "blog_post_id" IS NULL) OR ("recipe_id" IS NULL AND "blog_post_id" IS NOT NULL)`,
)
export class Like {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    user_id: string;

    @Column({ type: "uuid", nullable: true })
    recipe_id: string;

    @ManyToOne(() => BlogPost, (blog_post) => blog_post.likes, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "blog_post_id" })
    blog_post: BlogPost;

    @CreateDateColumn()
    created_at: Date;
}
