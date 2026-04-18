import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { BlogPost } from './blog-post.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { SavedRecipe } from './saved-recipe.entity';
import { Subscription } from './subscription.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ nullable: true })
    avatar_url: string;

    @Column({
        type: 'enum',
        enum: ['user', 'moderator', 'admin'],
        default: 'user',
    })
    role: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @OneToMany(() => Recipe, (recipe: Recipe) => recipe.author)
    recipes: Recipe[];

    @OneToMany(() => BlogPost, (blog_post: BlogPost) => blog_post.author)
    blog_posts: BlogPost[];

    @OneToMany(() => Comment, (comment: Comment) => comment.author)
    comments: Comment[];

    @OneToMany(() => Like, (like: Like) => like.user)
    likes: Like[];

    @OneToMany(
        () => SavedRecipe,
        (saved_recipe: SavedRecipe) => saved_recipe.user,
    )
    saved_recipes: SavedRecipe[];

    @OneToMany(
        () => Subscription,
        (subscription: Subscription) => subscription.following,
    )
    subscribers: Subscription[];

    @OneToMany(
        () => Subscription,
        (subscription: Subscription) => subscription.follower,
    )
    subscriptions: Subscription[];
}
