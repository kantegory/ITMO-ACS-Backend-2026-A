import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Check,
} from 'typeorm';
import { User } from './user.entity';
import { Recipe } from './recipe.entity';
import { BlogPost } from './blog-post.entity';

@Entity('likes')
@Check(
    `("recipe_id" IS NOT NULL AND "blog_post_id" IS NULL) OR ("recipe_id" IS NULL AND "blog_post_id" IS NOT NULL)`,
)
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user: User) => user.likes, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Recipe, (recipe: Recipe) => recipe.likes, {
        nullable: true,
    })
    @JoinColumn({ name: 'recipe_id' })
    recipe: Recipe;

    @ManyToOne(() => BlogPost, (blog_post: BlogPost) => blog_post.likes, {
        nullable: true,
    })
    @JoinColumn({ name: 'blog_post_id' })
    blog_post: BlogPost;

    @CreateDateColumn()
    created_at: Date;
}
