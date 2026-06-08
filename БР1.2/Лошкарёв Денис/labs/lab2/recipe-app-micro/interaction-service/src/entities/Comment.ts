import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("comments")
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "text" })
    content!: string;

    @Column()
    userId!: number; 

    @Column()
    recipeId!: number; 

    @CreateDateColumn()
    created_at!: Date;
}