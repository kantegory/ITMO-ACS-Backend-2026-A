import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from "typeorm";
import { Comment } from "./comment.entity";
import { Like } from "./like.entity";

@Entity("blog_posts")
export class BlogPost {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column({ type: "text" })
    content: string;

    @Column({ nullable: true })
    image_url: string;

    @Column({ type: "uuid" })
    author_id: string;

    @OneToMany(() => Comment, (comment) => comment.blog_post)
    comments: Comment[];

    @OneToMany(() => Like, (like) => like.blog_post)
    likes: Like[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
