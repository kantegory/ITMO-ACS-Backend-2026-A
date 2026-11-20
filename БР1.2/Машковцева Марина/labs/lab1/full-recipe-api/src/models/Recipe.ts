import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "./User";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { SavedRecipe } from "./SavedRecipe";
import { Step } from "./Step";

@Entity()
export class Recipe {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column("text")
    description: string;

    @Column()
    cooking_time: number;

    @Column({ type: "varchar", default: "medium" })
    difficulty: string; 

    @Column({ nullable: true })
    category: string; 

    @Column({ nullable: true })
    image_url: string; 

    @Column({ nullable: true })
    video_url: string; 

    @ManyToOne(() => User, user => user.recipes)
    author: User;

    @Column()
    author_id: number;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Comment, comment => comment.recipe)
    comments: Comment[];

    @OneToMany(() => Like, like => like.recipe)
    likes: Like[];

    @OneToMany(() => SavedRecipe, saved => saved.recipe)
    savedBy: SavedRecipe[];

    @OneToMany(() => Step, step => step.recipe)
    steps: Step[];
}