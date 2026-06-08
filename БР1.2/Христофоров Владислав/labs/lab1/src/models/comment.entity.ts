import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Check,
} from 'typeorm';
import { User } from './user.entity';
import { Recipe } from './recipe.entity';
import { BlogPost } from './blog-post.entity';

@Entity('comments')
@Check(
    `("recipe_id" IS NOT NULL AND "blog_post_id" IS NULL) OR ("recipe_id" IS NULL AND "blog_post_id" IS NOT NULL)`,
)
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @ManyToOne(() => User, (user: User) => user.comments, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    author: User;

    @ManyToOne(() => Recipe, (recipe: Recipe) => recipe.comments, {
        nullable: true,
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @ManyToOne(() => BlogPost, (blog_post: BlogPost) => blog_post.comments, {
        nullable: true,
    })
    @JoinColumn({ name: 'blog_post_id' })
    blog_post: BlogPost;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
