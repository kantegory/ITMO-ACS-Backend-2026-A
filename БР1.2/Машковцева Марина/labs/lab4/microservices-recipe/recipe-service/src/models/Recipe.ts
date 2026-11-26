import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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

    @Column()
    difficulty: string;

    @Column({ nullable: true })
    category: string;

    @Column({ nullable: true })
    image_url: string;

    @Column({ nullable: true })
    video_url: string;

    @Column()
    author_id: number;

    @CreateDateColumn()
    created_at: Date;
}
