import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

@Entity('blog_posts')
export class BlogPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ nullable: true })
    image_url: string;

    @ManyToOne(() => User, (user: User) => user.blog_posts, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @OneToMany(() => Comment, (comment: Comment) => comment.blog_post)
    comments: Comment[];

    @OneToMany(() => Like, (like: Like) => like.user)
    likes: Like[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
